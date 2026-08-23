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

  const loadProfile = useCallback(async (userId: string) => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, mobile, name, role, member_uid")
      .eq("id", userId)
      .single();
    if (!error && data) {
      setProfile(data as Profile);
    } else {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    let isMounted = true;

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
        }
      })
      .catch(() => {
        // A hung/failed initial session check should never trap the app on
        // a permanent loading screen — fall through to the login screen
        // (or local-only mode) and let the user retry from there.
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!isMounted) return;
        setSession(newSession);
        registerDeviceTokenForUser(newSession?.user?.id ?? null);
        if (newSession?.user) {
          await loadProfile(newSession.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadProfile]);

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
    if (!supabase) return;
    await supabase.auth.signOut();
    setProfile(null);
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
