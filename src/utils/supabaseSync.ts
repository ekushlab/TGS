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

  const {
    data: { session },
  } = await supabase.auth.getSession();
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

async function syncGenericTable<T extends Record<string, any>>(
  key: SyncableKey,
  next: T[],
  prev: T[]
) {
  if (!supabase) return;
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

  if (toUpsert.length) {
    const { error } = await supabase.from(table).upsert(toUpsert);
    if (error) console.error(`Supabase upsert failed for ${table}:`, error.message);
  }
  if (toDeleteIds.length) {
    const { error } = await supabase.from(table).delete().in(idKey, toDeleteIds);
    if (error) console.error(`Supabase delete failed for ${table}:`, error.message);
  }
}

async function syncPolls(next: Poll[], prev: Poll[]) {
  if (!supabase) return;
  // Strip `votes` before storing — votes live in their own table so member
  // vote-casting (RLS-restricted) never needs write access to the poll row.
  const strip = (p: Poll) => {
    const { votes, ...rest } = p;
    return rest;
  };
  await syncGenericTable("polls", next.map(strip) as any, prev.map(strip) as any);
}

async function syncSettings(next: AppData["settings"], prev: AppData["settings"]) {
  if (!supabase || !next) return;
  if (rowsEqual(next, prev)) return;
  const { error } = await supabase
    .from("app_settings")
    .upsert({ id: "singleton", data: next, updated_at: new Date().toISOString() });
  if (error) console.error("Supabase upsert failed for app_settings:", error.message);
}

/**
 * Called every time the app saves data locally. Diffs against the last
 * known-synced snapshot and pushes only what changed, per table. Silently
 * no-ops if Supabase isn't configured or there's no session yet (e.g. the
 * very first local-only load before login).
 */
export async function syncAppDataToSupabase(data: AppData): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const {
    data: { session },
  } = await supabase.auth.getSession();
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

  await Promise.all([
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

  lastSynced = data;
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
