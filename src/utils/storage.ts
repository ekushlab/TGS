import { AppData, AppSettings } from '../types';
import { STORAGE_KEY, DEFAULT_SETTINGS } from './helpers';
import {
  SEED_MEMBERS,
  SEED_DEPOSITS,
  SEED_BANK,
  SEED_INVEST,
  SEED_FUND_INCOME,
  SEED_EXPENSES,
  SEED_NOTIFICATIONS,
  SEED_POLLS,
  SEED_PROFIT_DISTRIBUTIONS,
} from '../data/seed';
import { fetchAllFromSupabase, syncAppDataToSupabase } from './supabaseSync';
import { isSupabaseConfigured } from './supabaseClient';

export async function loadAppData(): Promise<AppData> {
  // When Supabase is configured and the user is logged in, the database is
  // the source of truth — pull it fresh and cache locally for offline use.
  if (isSupabaseConfigured) {
    const remote = await fetchAllFromSupabase();
    if (remote) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
      } catch (e) {
        console.error('Local cache write failed', e);
      }
      return {
        ...remote,
        settings: remote.settings ? { ...DEFAULT_SETTINGS, ...remote.settings } : DEFAULT_SETTINGS,
      };
    }
  }

  try {
    if (typeof window !== 'undefined' && (window as any).storage?.get) {
      const res = await (window as any).storage.get(STORAGE_KEY, false);
      if (res && res.value) {
        const parsed = JSON.parse(res.value);
        const rawNotifications = (parsed.notifications || []).filter(
          (n: any) => !['notif-1', 'notif-2', 'notif-3'].includes(n.id)
        );
        const rawPolls = (parsed.polls || []).filter(
          (p: any) => !['poll-1', 'poll-2'].includes(p.id)
        );

        return {
          members: parsed.members?.length ? parsed.members : SEED_MEMBERS,
          deposits: parsed.deposits ?? [],
          bankEntries: parsed.bankEntries ?? [],
          investEntries: parsed.investEntries ?? [],
          fundIncome: parsed.fundIncome ?? [],
          expenses: parsed.expenses ?? [],
          settings: parsed.settings ? { ...DEFAULT_SETTINGS, ...parsed.settings } : DEFAULT_SETTINGS,
          notifications: rawNotifications,
          polls: rawPolls,
          profitDistributions: parsed.profitDistributions ?? [],
        };
      }
    }

    const local = localStorage.getItem(STORAGE_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      const rawNotifications = (parsed.notifications || []).filter(
        (n: any) => !['notif-1', 'notif-2', 'notif-3'].includes(n.id)
      );
      const rawPolls = (parsed.polls || []).filter(
        (p: any) => !['poll-1', 'poll-2'].includes(p.id)
      );

      return {
        members: parsed.members?.length ? parsed.members : SEED_MEMBERS,
        deposits: parsed.deposits ?? [],
        bankEntries: parsed.bankEntries ?? [],
        investEntries: parsed.investEntries ?? [],
        fundIncome: parsed.fundIncome ?? [],
        expenses: parsed.expenses ?? [],
        settings: parsed.settings ? { ...DEFAULT_SETTINGS, ...parsed.settings } : DEFAULT_SETTINGS,
        notifications: rawNotifications,
        polls: rawPolls,
        profitDistributions: parsed.profitDistributions ?? [],
      };
    }
  } catch (e) {
    console.error("Storage load error", e);
  }

  return {
    members: SEED_MEMBERS,
    deposits: SEED_DEPOSITS,
    bankEntries: SEED_BANK,
    investEntries: SEED_INVEST,
    fundIncome: SEED_FUND_INCOME,
    expenses: SEED_EXPENSES,
    settings: DEFAULT_SETTINGS,
    notifications: SEED_NOTIFICATIONS,
    polls: SEED_POLLS,
    profitDistributions: SEED_PROFIT_DISTRIBUTIONS,
  };
}

export async function saveAppData(data: AppData): Promise<void> {
  try {
    const jsonStr = JSON.stringify(data);
    if (typeof window !== 'undefined' && (window as any).storage?.set) {
      await (window as any).storage.set(STORAGE_KEY, jsonStr, false);
    }
    localStorage.setItem(STORAGE_KEY, jsonStr);
  } catch (e) {
    console.error("Storage save error", e);
  }

  if (isSupabaseConfigured) {
    // Fire-and-forget: push only what changed to Supabase so every other
    // signed-in device picks it up via realtime, without blocking the UI.
    syncAppDataToSupabase(data).catch((e) =>
      console.error('Supabase sync failed', e)
    );
  }
}

