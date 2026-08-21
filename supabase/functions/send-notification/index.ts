// ============================================================================
// Edge Function: send-notification
// ----------------------------------------------------------------------------
// Lets an already-logged-in ADMIN broadcast a real Android push notification
// (rendered as a Messenger-style "bubble" by the app — see
// android/app/src/main/java/.../MyFirebaseMessagingService.java) to every
// device that has the app installed and has registered an FCM token.
//
// This function signs its own Google OAuth2 access token from the Firebase
// service account key (FCM_SERVICE_ACCOUNT_JSON secret) and calls the FCM
// HTTP v1 API directly — no external npm/deno FCM library needed.
//
// Deploy: Supabase Dashboard → Edge Functions → Deploy new function →
// name it exactly "send-notification" → paste this file's contents.
//
// Required secret (Dashboard → Edge Functions → Manage secrets):
//   FCM_SERVICE_ACCOUNT_JSON = the full contents of the Firebase service
//   account JSON downloaded from Project settings → Service accounts →
//   Generate new private key.
//
// Called from the app via:
//   supabase.functions.invoke('send-notification', { body: { title, body } })
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const saJsonRaw = Deno.env.get("FCM_SERVICE_ACCOUNT_JSON");

    if (!saJsonRaw) {
      return json(
        {
          error:
            "FCM_SERVICE_ACCOUNT_JSON secret is not set. Add it in Dashboard → Edge Functions → Manage secrets.",
        },
        500
      );
    }

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
      return json({ error: "Only an admin can send notifications." }, 403);
    }

    const body = await req.json();
    const title = String(body?.title || "").trim();
    const message = String(body?.body || "").trim();
    if (!title || !message) {
      return json({ error: "title and body are required." }, 400);
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: tokenRows, error: tokenErr } = await admin
      .from("device_tokens")
      .select("id, fcm_token");
    if (tokenErr) return json({ error: tokenErr.message }, 500);

    if (!tokenRows || tokenRows.length === 0) {
      return json({ ok: true, sent: 0, failed: 0, total: 0, note: "No registered devices yet." });
    }

    const sa = JSON.parse(saJsonRaw) as ServiceAccount;
    const accessToken = await getGoogleAccessToken(sa);
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;

    let sent = 0;
    let failed = 0;
    const staleTokenIds: string[] = [];

    // Send sequentially in small batches to stay well within Edge Function
    // CPU/time limits while avoiding hammering FCM.
    const BATCH_SIZE = 20;
    for (let i = 0; i < tokenRows.length; i += BATCH_SIZE) {
      const batch = tokenRows.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (row) => {
          try {
            const res = await fetch(fcmUrl, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              // Data-only message: no top-level "notification" key. This
              // guarantees MyFirebaseMessagingService.onMessageReceived()
              // always runs (foreground AND background/killed on most
              // OEMs), so our own code builds the bubble notification
              // instead of the OS showing a plain default one.
              body: JSON.stringify({
                message: {
                  token: row.fcm_token,
                  data: {
                    title,
                    body: message,
                  },
                  android: { priority: "high" },
                },
              }),
            });
            if (res.ok) {
              sent++;
            } else {
              failed++;
              const errBody = await res.json().catch(() => ({}));
              const errCode =
                errBody?.error?.details?.find(
                  (d: any) => d.errorCode
                )?.errorCode || "";
              if (errCode === "UNREGISTERED" || errCode === "NOT_FOUND" || errCode === "INVALID_ARGUMENT") {
                staleTokenIds.push(row.id);
              }
            }
          } catch {
            failed++;
          }
        })
      );
    }

    if (staleTokenIds.length > 0) {
      await admin.from("device_tokens").delete().in("id", staleTokenIds);
    }

    return json({
      ok: true,
      sent,
      failed,
      total: tokenRows.length,
      removedStaleTokens: staleTokenIds.length,
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
