// ============================================================================
// Edge Function: notify-deposit-approved
// ----------------------------------------------------------------------------
// Called right after a Treasurer/Admin approves a member's monthly deposit
// request (see DepositRequest in src/types.ts + the Treasurer approval panel
// in the app). Does two things, both best-effort and independent of each
// other:
//
//   1. Sends a real Android push notification (same FCM v1 "bubble" pattern
//      as send-notification) to ONLY the approved member's own device(s) —
//      looked up via profiles.member_uid, not a broadcast to everyone.
//
//   2. If a WhatsApp gateway has been configured in the whatsapp_settings
//      table (Admin-only, set from the app's Settings → WhatsApp screen),
//      POSTs the same announcement to the configured TGS WhatsApp group.
//      This is generic — most third-party WhatsApp gateways (Wassenger,
//      Whapi.io, UltraMsg, Gupshup, ...) accept a POST with a bearer/API-key
//      header and a small JSON body, but the exact field names differ by
//      provider. Adjust `postToWhatsAppGateway()` below to match your
//      chosen provider's actual API docs once you sign up — until then this
//      step is simply skipped (whatsapp_settings.enabled stays false).
//
// Callable by an ADMIN or TREASURER only (matches who can approve a deposit
// request in the app's own UI).
//
// Deploy: Supabase Dashboard → Edge Functions → Deploy new function →
// name it exactly "notify-deposit-approved" → paste this file's contents.
// Reuses the same FCM_SERVICE_ACCOUNT_JSON secret as send-notification —
// no extra secret is required for the push half.
//
// Called from the app via:
//   supabase.functions.invoke('notify-deposit-approved', {
//     body: { memberUid, title, message }
//   })
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface ServiceAccount {
  client_email: string;
  private_key: string;
  project_id: string;
}

function base64url(input: Uint8Array | string): string {
  const bytes =
    typeof input === "string" ? new TextEncoder().encode(input) : input;
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function getGoogleAccessToken(sa: ServiceAccount): Promise<string> {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claimSet = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(
    JSON.stringify(claimSet)
  )}`;

  const pemBody = sa.private_key
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  const binaryDer = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryDer.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );

  const jwt = `${signingInput}.${base64url(new Uint8Array(signature))}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const tokenJson = await tokenRes.json();
  if (!tokenRes.ok) {
    throw new Error(
      tokenJson.error_description || tokenJson.error || "OAuth token request failed"
    );
  }
  return tokenJson.access_token as string;
}

/**
 * Best-effort POST to a third-party WhatsApp gateway. This shape (Bearer
 * auth header + {group_id, message} JSON body) is a common denominator
 * across gateways like Wassenger / Whapi.io / UltraMsg, but is NOT
 * guaranteed to match any specific provider's actual API — rename fields
 * here to match your provider's docs once you have one. Any failure here
 * is swallowed by the caller; it must never block the push notification.
 */
async function postToWhatsAppGateway(
  webhookUrl: string,
  apiKey: string,
  groupId: string,
  message: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ group_id: groupId, message }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 300)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
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

    if (callerProfile?.role !== "admin" && callerProfile?.role !== "treasurer") {
      return json(
        { error: "Only an Admin or Treasurer can approve a deposit and notify the member." },
        403
      );
    }

    const body = await req.json();
    const memberUid = String(body?.memberUid || "").trim();
    const title = String(body?.title || "").trim();
    const message = String(body?.message || "").trim();
    if (!memberUid || !title || !message) {
      return json({ error: "memberUid, title and message are required." }, 400);
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // --- 1. Targeted push notification to the approved member's device(s) ---
    let pushResult: { sent: number; failed: number; total: number; note?: string } = {
      sent: 0,
      failed: 0,
      total: 0,
    };

    const { data: memberProfiles, error: profilesErr } = await admin
      .from("profiles")
      .select("id")
      .eq("member_uid", memberUid);

    if (profilesErr) {
      pushResult.note = `Could not look up member's account: ${profilesErr.message}`;
    } else if (!memberProfiles || memberProfiles.length === 0) {
      pushResult.note = "This member has no login account linked yet — nothing to push to.";
    } else {
      const userIds = memberProfiles.map((p) => p.id);
      const { data: tokenRows, error: tokenErr } = await admin
        .from("device_tokens")
        .select("id, fcm_token")
        .in("user_id", userIds);

      if (tokenErr) {
        pushResult.note = `Could not look up device tokens: ${tokenErr.message}`;
      } else if (!tokenRows || tokenRows.length === 0) {
        pushResult.note = "No registered devices for this member yet.";
      } else {
        const saJsonRaw = Deno.env.get("FCM_SERVICE_ACCOUNT_JSON");
        if (!saJsonRaw) {
          pushResult.note =
            "FCM_SERVICE_ACCOUNT_JSON secret is not set — push skipped.";
        } else {
          const sa = JSON.parse(saJsonRaw) as ServiceAccount;
          const accessToken = await getGoogleAccessToken(sa);
          const fcmUrl = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;
          const staleTokenIds: string[] = [];

          await Promise.all(
            tokenRows.map(async (row) => {
              try {
                const res = await fetch(fcmUrl, {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    message: {
                      token: row.fcm_token,
                      data: { title, body: message },
                      android: { priority: "high" },
                    },
                  }),
                });
                if (res.ok) {
                  pushResult.sent++;
                } else {
                  pushResult.failed++;
                  const errBody = await res.json().catch(() => ({}));
                  const errCode =
                    errBody?.error?.details?.find((d: any) => d.errorCode)
                      ?.errorCode || "";
                  if (
                    errCode === "UNREGISTERED" ||
                    errCode === "NOT_FOUND" ||
                    errCode === "INVALID_ARGUMENT"
                  ) {
                    staleTokenIds.push(row.id);
                  }
                }
              } catch {
                pushResult.failed++;
              }
            })
          );
          pushResult.total = tokenRows.length;

          if (staleTokenIds.length > 0) {
            await admin.from("device_tokens").delete().in("id", staleTokenIds);
          }
        }
      }
    }

    // --- 2. Best-effort WhatsApp group announcement ---
    let whatsappResult: { attempted: boolean; ok?: boolean; note?: string; error?: string } = {
      attempted: false,
    };

    const { data: waSettings } = await admin
      .from("whatsapp_settings")
      .select("enabled, webhook_url, api_key, group_id")
      .eq("id", "singleton")
      .maybeSingle();

    if (!waSettings?.enabled) {
      whatsappResult.note = "WhatsApp integration is not enabled in Settings.";
    } else if (!waSettings.webhook_url || !waSettings.api_key || !waSettings.group_id) {
      whatsappResult.note =
        "WhatsApp integration is enabled but incomplete (missing URL/Key/Group ID).";
    } else {
      whatsappResult.attempted = true;
      const result = await postToWhatsAppGateway(
        waSettings.webhook_url,
        waSettings.api_key,
        waSettings.group_id,
        message
      );
      whatsappResult.ok = result.ok;
      if (!result.ok) whatsappResult.error = result.error;
    }

    return json({ ok: true, push: pushResult, whatsapp: whatsappResult });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
