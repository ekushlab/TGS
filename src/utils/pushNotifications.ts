import { supabase } from "./supabaseClient";

// ============================================================================
// Bridges the FCM device token from the Android WebView wrapper
// (android/.../MainActivity.java -> webView.evaluateJavascript(...)) into
// Supabase's `device_tokens` table, so the admin-only "send-notification"
// Edge Function can broadcast a push to every installed device.
//
// No-op outside the Android app shell (window.__onNativeFcmToken is simply
// never called on the web/PWA build).
// ============================================================================

declare global {
  interface Window {
    __onNativeFcmToken?: (token: string) => void;
  }
}

let latestToken: string | null = null;
let currentUserId: string | null = null;

async function upsertToken() {
  if (!supabase || !latestToken || !currentUserId) return;
  try {
    await supabase.from("device_tokens").upsert(
      {
        user_id: currentUserId,
        fcm_token: latestToken,
        platform: "android",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "fcm_token" }
    );
  } catch {
    // Best-effort — a failed registration just means this device won't
    // receive pushes until the next token refresh / app open.
  }
}

/** Call whenever the signed-in user changes (including to null on sign-out). */
export function registerDeviceTokenForUser(userId: string | null) {
  currentUserId = userId;
  void upsertToken();
}

if (typeof window !== "undefined") {
  window.__onNativeFcmToken = (token: string) => {
    latestToken = token;
    void upsertToken();
  };
}
