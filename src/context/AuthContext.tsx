import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "../utils/supabaseClient";
import { mobileToEmail, normalizeMobile } from "../utils/mobileAuth";
import { registerDeviceTokenForUser } from "../utils/pushNotifications";

// Three access tiers:
//   "admin"     — Super Admin: full access to everything, incl. Constitution &
//                 Bylaws editing, Members, Settings, and all financial ledgers.
//   "treasurer" — Treasurer / General Secretary: can ADD new entries in the
//                 deposits, bank, investment, and fund/expenses ledgers, and
//                 create new polls in the Voting & Notify Center — but has
//                 no access to editing Members, Settings, or the
//                 Constitution & Bylaws, and cannot create notices.
//   "member"    — Everyone else: can view reports on every tab, but cannot
//                 add, edit, or delete anything (except casting their own
//                 vote, which is handled separately from this role system).
export type UserRole = "admin" | "treasurer" | "member";

export interface Profile {
  id: string;
  mobile: string;
  name: string;
  role: UserRole;
  member_uid: string | null;
}

interface AuthContextValue {
  /** False until Supabase is configured — the app runs fully unlocked (legacy behavior). */
  authEnabled: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  /**
   * True when the person is using the app on the strength of a previously
   * cached login rather than a live-verified Supabase session — i.e. they
   * opened (or re-opened) the app with no internet connection. `session`
   * stays null in this state (there's no real, verifiable token), but
   * `profile` is populated from the last successful login on this device so
   * the app can still be used and viewed. Cleared automatically the moment
   * a real session can be (re-)established, e.g. once connectivity returns.
   */
  isOfflineSession: boolean;
  /**
   * True whenever the person should be treated as logged in — either a real
   * session, or a cached offline one. Prefer this (over checking `session`
   * or `user` directly) for "is someone logged in" UI gating, since a plain
   * `session`/`user` check would incorrectly hide content and controls
   * during a cached offline session.
   */
  isAuthenticated: boolean;
  /** Super Admin — full access to everything. */
  isAdmin: boolean;
  /** Treasurer / General Secretary — limited entry-only access (see UserRole above). */
  isTreasurer: boolean;
  /**
   * True for Super Admin OR Treasurer/Secretary — the set of people allowed
   * to add new deposits, bank entries, investment entries, fund income,
   * expenses, and polls. Use this (not isAdmin) to gate those "Add ..."
   * buttons so Treasurer/Secretary logins see them too.
   */
  canManageEntries: boolean;
  /** The Member.uid linked to the logged-in person, if any. */
  currentMemberUid: string | null;
  signIn: (
    mobile: string,
    password: string
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Lets someone stay logged in (and see their cached content) when the app is
 * opened with no internet connection — e.g. a treasurer out in the field
 * with no signal. A Supabase access token normally lasts about an hour; past
 * that, refreshing it requires a live network call, so getSession() would
 * otherwise cleanly resolve to "no session" and bounce the person to the
 * login screen even though nothing about THEIR login actually changed.
 *
 * We keep a small, non-sensitive snapshot of the last successfully loaded
 * profile in localStorage (never a password or token — Supabase's own SDK
 * already persists the real session/tokens separately). It's only ever used
 * as a fallback, and only when the device appears offline, never to paper
 * over an actual sign-out or access change while online.
 */
const OFFLINE_PROFILE_CACHE_KEY = "tgs_offline_profile_cache";

interface CachedProfileEntry {
  userId: string;
  profile: Profile;
  cachedAt: number;
}

function cacheProfile(userId: string, profile: Profile) {
  try {
    const entry: CachedProfileEntry = { userId, profile, cachedAt: Date.now() };
    localStorage.setItem(OFFLINE_PROFILE_CACHE_KEY, JSON.stringify(entry));
  } catch {
    // localStorage unavailable/full — offline fallback just won't work this
    // time, but nothing else about the app breaks.
  }
}

function readCachedProfileEntry(): CachedProfileEntry | null {
  try {
    const raw = localStorage.getItem(OFFLINE_PROFILE_CACHE_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (entry && typeof entry === "object" && entry.profile && entry.userId) {
      return entry as CachedProfileEntry;
    }
  } catch {
    // ignore — treat as no cache
  }
  return null;
}

function clearCachedProfile() {
  try {
    localStorage.removeItem(OFFLINE_PROFILE_CACHE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Heuristic for "this failure looks like a connectivity problem, not a real
 * logout/permission change" — navigator.onLine is false when the device has
 * no network interface up at all (airplane mode, no SIM data, no Wi-Fi),
 * which reliably covers the field-collector scenario this exists for. It
 * can still read `true` on a Wi-Fi connection with no real internet behind
 * it; in that case the Supabase call will simply keep failing/timing out on
 * its own and the offline fallback below still applies via the timeout path.
 */
function looksOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

/**
 * Races a promise against a timeout so a hung network call never leaves the
 * UI spinning forever. Seen in practice on some older/uncommon Android
 * WebView builds (e.g. Poco/MIUI devices with a stale "Android System
 * WebView" component) where a fetch() can simply never settle instead of
 * failing fast — without this, the Login button's spinner never resolves.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, timeoutMessage: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(timeoutMessage)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

const LOGIN_TIMEOUT_MS = 20000;
const SESSION_TIMEOUT_MS = 15000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState<boolean>(isSupabaseConfigured);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isOfflineSession, setIsOfflineSession] = useState(false);

  /**
   * Falls back to whatever profile was cached from the last successful
   * login on this device. `force` skips the navigator.onLine check — used
   * when the caller already has a stronger signal of a connectivity problem
   * (a timed-out network call), since navigator.onLine can still read
   * `true` on a Wi-Fi connection with no real internet behind it.
   */
  const tryOfflineFallback = useCallback((force = false) => {
    if (!force && !looksOffline()) return false;
    const cached = readCachedProfileEntry();
    if (!cached) return false;
    setProfile(cached.profile);
    setIsOfflineSession(true);
    return true;
  }, []);

  const loadProfile = useCallback(
    async (userId: string) => {
      if (!supabase) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("id, mobile, name, role, member_uid")
        .eq("id", userId)
        .single();
      if (!error && data) {
        setProfile(data as Profile);
        setIsOfflineSession(false);
        cacheProfile(userId, data as Profile);
      } else {
        // The live profile fetch failed — most commonly because we're
        // offline. Don't demote/lock out someone who is simply out of
        // signal; fall back to their cached profile from this device's
        // last successful login instead of wiping their role/permissions.
        const cached = readCachedProfileEntry();
        if (cached && cached.userId === userId) {
          setProfile(cached.profile);
          setIsOfflineSession(true);
        } else {
          setProfile(null);
          setIsOfflineSession(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    // Shared by the initial mount check and by the "online" reconnect
    // handler below — re-verifies the real Supabase session and, if one
    // exists, loads the real profile (which itself clears offline mode on
    // success). Falls back to the cached identity when the device appears
    // offline instead of bouncing the person to the login screen.
    const checkSession = () => {
      withTimeout(
        supabase.auth.getSession(),
        SESSION_TIMEOUT_MS,
        "Session check timed out."
      )
        .then(async ({ data }) => {
          if (!isMounted) return;
          setSession(data.session);
          registerDeviceTokenForUser(data.session?.user?.id ?? null);
          if (data.session?.user) {
            await loadProfile(data.session.user.id);
          } else if (!tryOfflineFallback()) {
            setProfile(null);
            setIsOfflineSession(false);
          }
        })
        .catch(() => {
          // A hung/failed session check (e.g. no network at all) should
          // never trap the app on a permanent loading screen, and — when we
          // have a previous login cached on this device — shouldn't force a
          // login screen the person has no way to complete without a
          // network connection either. `force: true` here because a timed
          // out call is itself strong evidence of a connectivity problem.
          if (!isMounted) return;
          if (!tryOfflineFallback(true)) {
            setProfile(null);
            setIsOfflineSession(false);
          }
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    };

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!isMounted) return;
        setSession(newSession);
        registerDeviceTokenForUser(newSession?.user?.id ?? null);
        if (newSession?.user) {
          await loadProfile(newSession.user.id);
        } else {
          // A real SIGNED_OUT (or similar) event from the SDK — respect it
          // as-is; the offline fallback only ever applies to the initial
          // bootstrap check above, never here, so an explicit logout always
          // sticks regardless of connectivity.
          setProfile(null);
          setIsOfflineSession(false);
        }
      }
    );

    // The moment connectivity returns, try to replace the cached/offline
    // identity with a real, freshly-verified session and profile.
    const handleOnline = () => {
      checkSession();
    };
    window.addEventListener("online", handleOnline);

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
      window.removeEventListener("online", handleOnline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadProfile, tryOfflineFallback]);

  const signIn = useCallback(
    async (mobile: string, password: string) => {
      if (!supabase) return { error: "Supabase is not configured." };
      const email = mobileToEmail(normalizeMobile(mobile));
      try {
        const { error } = await withTimeout(
          supabase.auth.signInWithPassword({ email, password }),
          LOGIN_TIMEOUT_MS,
          "TIMEOUT"
        );
        if (error) return { error: error.message };
        return { error: null };
      } catch (err) {
        // Covers both a genuine timeout (hung fetch — seen on some older/
        // uncommon Android WebView builds) and any other network-level
        // throw, so the Login button always stops spinning and the user
        // always sees an actionable message instead of an infinite loader.
        const message = err instanceof Error ? err.message : String(err);
        if (message === "TIMEOUT") {
          return { error: "TIMEOUT" };
        }
        return { error: message || "NETWORK_ERROR" };
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    // Always clear local state first so an explicit "log out" tap works
    // instantly even offline (e.g. a hung network call to Supabase's
    // /logout endpoint should never trap someone who wants to hand the
    // device to someone else) — the cached-login fallback must not survive
    // a deliberate sign-out regardless of connectivity.
    clearCachedProfile();
    setIsOfflineSession(false);
    setProfile(null);
    if (!supabase) return;
    try {
      await withTimeout(supabase.auth.signOut(), 10000, "Sign out timed out.");
    } catch {
      // Offline/hung network — local state is already cleared above; the
      // server-side session will simply expire on its own.
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) await loadProfile(session.user.id);
  }, [session, loadProfile]);

  // When Supabase isn't configured, the app runs fully unlocked (legacy
  // local-only behavior) — treat that case as Super Admin everywhere.
  const isAdmin = !isSupabaseConfigured || profile?.role === "admin";
  const isTreasurer = isSupabaseConfigured && profile?.role === "treasurer";

  const value: AuthContextValue = {
    authEnabled: isSupabaseConfigured,
    loading,
    session,
    user: session?.user ?? null,
    profile,
    isOfflineSession,
    isAuthenticated: Boolean(session) || isOfflineSession,
    isAdmin,
    isTreasurer,
    canManageEntries: isAdmin || isTreasurer,
    currentMemberUid: profile?.member_uid ?? null,
    signIn,
    signOut,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
