import { supabase, isSupabaseConfigured } from "./supabaseClient";
import {
  AppData,
  Member,
  Deposit,
  AccountEntry,
  FundIncome,
  Expense,
  AppNotification,
  Poll,
  PollVote,
  ProfitDistribution,
} from "../types";

// Maps each AppData array key to its Supabase table + row id field.
// (settings and polls are handled specially, see below.)
const TABLE_MAP: Record<string, { table: string; idKey: string }> = {
  members: { table: "members", idKey: "uid" },
  deposits: { table: "deposits", idKey: "id" },
  bankEntries: { table: "bank_entries", idKey: "id" },
  investEntries: { table: "invest_entries", idKey: "id" },
  fundIncome: { table: "fund_income", idKey: "id" },
  expenses: { table: "expenses", idKey: "id" },
  notifications: { table: "notifications", idKey: "id" },
  profitDistributions: { table: "profit_distributions", idKey: "id" },
  polls: { table: "polls", idKey: "id" },
};

type SyncableKey = keyof typeof TABLE_MAP;

/**
 * Races a promise against a timeout so a hung/offline network call never
 * blocks the caller forever — the same problem AuthContext.tsx guards
 * against for login, needed here too since fetchAllFromSupabase() and
 * syncAppDataToSupabase() both call supabase.auth.getSession() directly.
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

/** Last snapshot we know Supabase agrees with — used to diff on every save. */
let lastSynced: AppData | null = null;

export function setLastSyncedSnapshot(data: AppData) {
  lastSynced = data;
}

export function clearLastSyncedSnapshot() {
  lastSynced = null;
}

async function fetchGenericTable<T>(table: string): Promise<T[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from(table).select("data");
  if (error) {
    console.error(`Supabase fetch failed for ${table}:`, error.message);
    return null;
  }
  return (data || []).map((row: any) => row.data as T);
}

async function fetchPolls(): Promise<Poll[] | null> {
  if (!supabase) return null;
  const [pollsRes, votesRes] = await Promise.all([
    supabase.from("polls").select("data"),
    supabase.from("poll_votes").select("*"),
  ]);
  if (pollsRes.error) {
    console.error("Supabase fetch failed for polls:", pollsRes.error.message);
    return null;
  }
  if (votesRes.error) {
    console.error(
      "Supabase fetch failed for poll_votes:",
      votesRes.error.message
    );
    return null;
  }

  const votesByPoll = new Map<string, PollVote[]>();
  for (const row of votesRes.data || []) {
    const vote: PollVote = {
      id: row.id,
      pollId: row.poll_id,
      memberUid: row.member_uid,
      memberName: row.member_name,
      memberMobile: row.member_mobile ?? undefined,
      optionId: row.option_id,
      optionText: row.option_text,
      votedAt: row.voted_at,
      timestamp: row.timestamp,
      comment: row.comment ?? undefined,
    };
    const list = votesByPoll.get(vote.pollId) || [];
    list.push(vote);
    votesByPoll.set(vote.pollId, list);
  }

  return (pollsRes.data || []).map((row: any) => {
    const poll = row.data as Poll;
    return { ...poll, votes: votesByPoll.get(poll.id) || [] };
  });
}

async function fetchSettings() {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("app_settings")
    .select("data")
    .eq("id", "singleton")
    .maybeSingle();
  if (error) {
    console.error("Supabase fetch failed for app_settings:", error.message);
    return null;
  }
  return data?.data ?? null;
}

/**
 * Pulls the full app dataset from Supabase. Returns null (never partial) if
 * anything fails or the caller isn't authenticated yet, so callers can
 * cleanly fall back to the local cache.
 */
export async function fetchAllFromSupabase(): Promise<AppData | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  let session;
  try {
    const result = await withTimeout(
      supabase.auth.getSession(),
      10000,
      "Session check timed out."
    );
    session = result.data.session;
  } catch {
    // Offline / hung network — fall back to the local cache like any other
    // failure below, rather than hanging the whole app data load.
    return null;
  }
  if (!session) return null;

  try {
    const [
      members,
      deposits,
      bankEntries,
      investEntries,
      fundIncome,
      expenses,
      notifications,
      polls,
      profitDistributions,
      settings,
    ] = await Promise.all([
      fetchGenericTable<Member>("members"),
      fetchGenericTable<Deposit>("deposits"),
      fetchGenericTable<AccountEntry>("bank_entries"),
      fetchGenericTable<AccountEntry>("invest_entries"),
      fetchGenericTable<FundIncome>("fund_income"),
      fetchGenericTable<Expense>("expenses"),
      fetchGenericTable<AppNotification>("notifications"),
      fetchPolls(),
      fetchGenericTable<ProfitDistribution>("profit_distributions"),
      fetchSettings(),
    ]);

    // If every single fetch failed (e.g. tables don't exist yet), bail out
    // entirely rather than returning an all-empty dataset that would look
    // like "society has zero members" and get saved back over real data.
    const anyFailed = [
      members,
      deposits,
      bankEntries,
      investEntries,
      fundIncome,
      expenses,
      notifications,
      polls,
      profitDistributions,
    ].some((r) => r === null);
    if (anyFailed) return null;

    const result: AppData = {
      members: members || [],
      deposits: deposits || [],
      bankEntries: bankEntries || [],
      investEntries: investEntries || [],
      fundIncome: fundIncome || [],
      expenses: expenses || [],
      notifications: notifications || [],
      polls: polls || [],
      profitDistributions: profitDistributions || [],
      settings: settings || undefined,
    };
    setLastSyncedSnapshot(result);
    return result;
  } catch (e) {
    console.error("fetchAllFromSupabase failed:", e);
    return null;
  }
}

function rowsEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Pushes one table's diff to Supabase and returns the snapshot that should
 * be recorded as "last known synced" for it. On success that's simply the
 * new data; on failure (most commonly: offline) it's the OLD (prev) data,
 * so the next sync pass still sees a difference and retries the same push
 * instead of silently marking a failed/offline write as done — which is
 * what let offline edits get lost for good once connectivity returned.
 */
async function syncGenericTable<T extends Record<string, any>>(
  key: SyncableKey,
  next: T[],
  prev: T[]
): Promise<T[]> {
  if (!supabase) return prev;
  const { table, idKey } = TABLE_MAP[key];

  const prevById = new Map(prev.map((item) => [item[idKey], item]));
  const nextById = new Map(next.map((item) => [item[idKey], item]));

  const toUpsert: { [k: string]: any }[] = [];
  for (const [id, item] of nextById) {
    const prevItem = prevById.get(id);
    if (!prevItem || !rowsEqual(prevItem, item)) {
      toUpsert.push({ [idKey]: id, data: item, updated_at: new Date().toISOString() });
    }
  }
  const toDeleteIds: any[] = [];
  for (const id of prevById.keys()) {
    if (!nextById.has(id)) toDeleteIds.push(id);
  }

  let failed = false;
  if (toUpsert.length) {
    const { error } = await supabase.from(table).upsert(toUpsert);
    if (error) {
      console.error(`Supabase upsert failed for ${table}:`, error.message);
      failed = true;
    }
  }
  if (toDeleteIds.length) {
    const { error } = await supabase.from(table).delete().in(idKey, toDeleteIds);
    if (error) {
      console.error(`Supabase delete failed for ${table}:`, error.message);
      failed = true;
    }
  }

  return failed ? prev : next;
}

async function syncPolls(next: Poll[], prev: Poll[]): Promise<Poll[]> {
  if (!supabase) return prev;
  // Strip `votes` before storing — votes live in their own table so member
  // vote-casting (RLS-restricted) never needs write access to the poll row.
  const strip = (p: Poll) => {
    const { votes, ...rest } = p;
    return rest;
  };
  const strippedNext = next.map(strip) as any;
  const strippedPrev = prev.map(strip) as any;
  const result = await syncGenericTable("polls", strippedNext, strippedPrev);
  // syncGenericTable hands back one of its two input params by reference —
  // use that to tell success (stripped-next) from failure (stripped-prev)
  // and return the corresponding *full* (with-votes) array.
  return result === strippedNext ? next : prev;
}

async function syncSettings(
  next: AppData["settings"],
  prev: AppData["settings"]
): Promise<AppData["settings"]> {
  if (!supabase || !next) return prev;
  if (rowsEqual(next, prev)) return next;
  const { error } = await supabase
    .from("app_settings")
    .upsert({ id: "singleton", data: next, updated_at: new Date().toISOString() });
  if (error) {
    console.error("Supabase upsert failed for app_settings:", error.message);
    return prev;
  }
  return next;
}

/**
 * Called every time the app saves data locally. Diffs against the last
 * known-synced snapshot and pushes only what changed, per table. Silently
 * no-ops if Supabase isn't configured or there's no session yet (e.g. the
 * very first local-only load before login) — and, critically, only advances
 * "last known synced" for the parts of the push that actually succeeded, so
 * a write made while offline (or during any other transient failure) stays
 * flagged as unsynced and gets retried automatically on the next call —
 * e.g. the reconnect-triggered retry in App.tsx's "online" handler — instead
 * of being silently dropped.
 */
export async function syncAppDataToSupabase(data: AppData): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  let session;
  try {
    const result = await withTimeout(
      supabase.auth.getSession(),
      10000,
      "Session check timed out."
    );
    session = result.data.session;
  } catch {
    // Offline / hung network — nothing to push right now; the next call
    // (e.g. on reconnect) will retry against the unchanged lastSynced.
    return;
  }
  if (!session) return;

  const prev = lastSynced || {
    members: [],
    deposits: [],
    bankEntries: [],
    investEntries: [],
    fundIncome: [],
    expenses: [],
    notifications: [],
    polls: [],
    profitDistributions: [],
    settings: undefined,
  };

  const [
    members,
    deposits,
    bankEntries,
    investEntries,
    fundIncome,
    expenses,
    notifications,
    polls,
    profitDistributions,
    settings,
  ] = await Promise.all([
    syncGenericTable("members", data.members, prev.members),
    syncGenericTable("deposits", data.deposits, prev.deposits),
    syncGenericTable("bankEntries", data.bankEntries, prev.bankEntries),
    syncGenericTable("investEntries", data.investEntries, prev.investEntries),
    syncGenericTable("fundIncome", data.fundIncome, prev.fundIncome),
    syncGenericTable("expenses", data.expenses, prev.expenses),
    syncGenericTable(
      "notifications",
      data.notifications || [],
      prev.notifications || []
    ),
    syncPolls(data.polls || [], prev.polls || []),
    syncGenericTable(
      "profitDistributions",
      data.profitDistributions || [],
      prev.profitDistributions || []
    ),
    syncSettings(data.settings, prev.settings),
  ]);

  lastSynced = {
    members,
    deposits,
    bankEntries,
    investEntries,
    fundIncome,
    expenses,
    notifications,
    polls,
    profitDistributions,
    settings,
  };
}

/**
 * Directly records one member's vote (insert-or-update), bypassing the
 * generic admin-only table diff above. RLS allows a member to write only
 * their own vote row, which is exactly what this does.
 */
export async function syncPollVoteToSupabase(vote: PollVote): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase.from("poll_votes").upsert(
    {
      id: vote.id,
      poll_id: vote.pollId,
      member_uid: vote.memberUid,
      member_name: vote.memberName,
      member_mobile: vote.memberMobile ?? null,
      option_id: vote.optionId,
      option_text: vote.optionText,
      voted_at: vote.votedAt,
      timestamp: vote.timestamp,
      comment: vote.comment ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
  if (error) return { error: error.message };
  return { error: null };
}

/**
 * Self-service "My Profile" update — writes ONLY the caller's own linked
 * member row, and only a whitelisted set of safe fields (photo, contact
 * info, blood group, bio). Backed by the `update_own_member_profile`
 * Postgres RPC (SECURITY DEFINER), which enforces both restrictions on the
 * server side — the generic `members` table RLS policy stays admin-only, so
 * a member can never write name/NID/nominee data or another member's row,
 * even via a raw API call that bypasses this app's own UI.
 */
export async function syncOwnMemberProfileToSupabase(patch: {
  photo?: string;
  photoFormat?: 'passport' | '300x300';
  photoSize?: number;
  mobile?: string;
  email?: string;
  address?: string;
  blood?: string;
  bio?: string;
}): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase.rpc("update_own_member_profile", {
    p_photo: patch.photo ?? null,
    p_photo_format: patch.photoFormat ?? null,
    p_photo_size: patch.photoSize ?? null,
    p_mobile: patch.mobile ?? null,
    p_email: patch.email ?? null,
    p_address: patch.address ?? null,
    p_blood: patch.blood ?? null,
    p_bio: patch.bio ?? null,
  });
  if (error) return { error: error.message };
  return { error: null };
}

const REALTIME_TABLES = [
  "members",
  "deposits",
  "bank_entries",
  "invest_entries",
  "fund_income",
  "expenses",
  "notifications",
  "polls",
  "profit_distributions",
  "app_settings",
  "poll_votes",
];

/**
 * Subscribes to changes on every synced table. Calls onChange (debounced)
 * whenever anything changes on another device, so the caller can re-fetch
 * and refresh on-screen state — the "auto sync when online" behavior.
 */
export function subscribeToRealtimeChanges(onChange: () => void): () => void {
  if (!isSupabaseConfigured || !supabase) return () => {};

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  const trigger = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(onChange, 700);
  };

  const channel = supabase.channel("tgs-data-sync");
  for (const table of REALTIME_TABLES) {
    channel.on(
      "postgres_changes" as any,
      { event: "*", schema: "public", table },
      trigger
    );
  }
  channel.subscribe();

  return () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    supabase.removeChannel(channel);
  };
}
