// ============================================================================
// Edge Function: admin-manage-login
// ----------------------------------------------------------------------------
// Lets an already-logged-in ADMIN create, reset, promote, or revoke a
// member's login — without ever exposing the Supabase service role key to
// the browser. The service role key only ever lives inside this function
// (Supabase injects SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY
// automatically into every Edge Function — you do not need to set them).
//
// Deploy: Supabase Dashboard → Edge Functions → Deploy new function →
// name it exactly "admin-manage-login" → paste this file's contents.
// (Or via CLI: `supabase functions deploy admin-manage-login`.)
//
// Called from the app via:
//   supabase.functions.invoke('admin-manage-login', { body: { action: 'create', ... } })
// The user's access token is attached automatically by the client SDK.
//
// IMPORTANT: mobileToEmail() below MUST exactly match
// src/utils/mobileAuth.ts on the front end, or logins will silently fail.
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function mobileToEmail(rawMobile: string): string {
  const digitsOnly = String(rawMobile || "").replace(/\D/g, "");
  let local = digitsOnly;
  if (local.startsWith("880")) local = "0" + local.slice(3);
  if (!local.startsWith("0") && local.length === 10) local = "0" + local;
  return `m${local}@tgsbd.org`;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user: caller },
    } = await callerClient.auth.getUser();
    if (!caller) return json({ error: "Not authenticated." }, 401);

    const { data: callerProfile } = await callerClient
      .from("profiles")
      .select("role")
      .eq("id", caller.id)
      .single();

    if (callerProfile?.role !== "admin") {
      return json({ error: "Only an admin can manage member logins." }, 403);
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const body = await req.json();
    const action = body?.action;

    if (action === "create") {
      const { mobile, password, name, member_uid, role } = body;
      if (!mobile || !password) {
        return json({ error: "mobile and password are required." }, 400);
      }
      const email = mobileToEmail(mobile);

      const { data: created, error: createErr } =
        await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { mobile, name: name || "" },
        });
      if (createErr || !created?.user) {
        return json(
          { error: createErr?.message || "Could not create the login." },
          400
        );
      }

      const { error: profileErr } = await admin.from("profiles").insert({
        id: created.user.id,
        mobile,
        name: name || "",
        role: role === "admin" ? "admin" : "member",
        member_uid: member_uid || null,
      });
      if (profileErr) {
        // Roll back the auth user so we don't leave an orphaned login.
        await admin.auth.admin.deleteUser(created.user.id);
        return json({ error: profileErr.message }, 400);
      }

      return json({
        ok: true,
        userId: created.user.id,
        mobile,
        password,
      });
    }

    if (action === "reset_password") {
      const { targetUserId, newPassword } = body;
      if (!targetUserId || !newPassword) {
        return json(
          { error: "targetUserId and newPassword are required." },
          400
        );
      }
      const { error } = await admin.auth.admin.updateUserById(targetUserId, {
        password: newPassword,
      });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === "set_role") {
      const { targetUserId, role } = body;
      if (!targetUserId || (role !== "admin" && role !== "member")) {
        return json(
          { error: "targetUserId and a valid role are required." },
          400
        );
      }
      const { error } = await admin
        .from("profiles")
        .update({ role })
        .eq("id", targetUserId);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === "revoke") {
      const { targetUserId } = body;
      if (!targetUserId) {
        return json({ error: "targetUserId is required." }, 400);
      }
      const { error } = await admin.auth.admin.deleteUser(targetUserId);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
