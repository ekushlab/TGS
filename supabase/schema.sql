-- ============================================================================
-- Trust Growth Society Ledger — Supabase schema
-- ============================================================================
-- Run this ONCE in your Supabase project's SQL Editor
-- (Dashboard → SQL Editor → New query → paste this whole file → Run).
--
-- Design notes:
--  * Every existing app table (members, deposits, bank entries, ...) is kept
--    as a JSONB "row per item" table (id + data jsonb). This mirrors the
--    exact shape the app already uses in localStorage, so almost no
--    front-end component needs to change — only the sync layer does.
--  * Poll votes are the one exception: they're normalized into their own
--    `poll_votes` table so Row Level Security can allow a member to insert
--    their OWN vote without letting them edit the poll itself (title,
--    options, status, ...), which a single JSONB poll row could not do.
--  * `profiles` links a Supabase Auth user to a member record and a role
--    (admin | member). Members log in with mobile+password in the app;
--    under the hood that maps to a synthetic email — see mobileToEmail()
--    in src/utils/mobileAuth.ts. Keep that mapping and this schema in sync.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Generic JSONB "row per item" tables (id = the app's own id/uid field)
--    (created before `profiles` below, which has a foreign key into `members`)
-- ---------------------------------------------------------------------------
create table if not exists public.members (
  uid text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.deposits (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.bank_entries (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.invest_entries (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.fund_income (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- polls table holds everything EXCEPT the `votes` array (see poll_votes below)
create table if not exists public.polls (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.profit_distributions (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- single-row settings table
create table if not exists public.app_settings (
  id text primary key default 'singleton',
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. profiles — one row per login-capable person, linked to auth.users
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  mobile text not null unique,
  name text not null default '',
  role text not null default 'member' check (role in ('admin', 'treasurer', 'member')),
  member_uid text references public.members (uid) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2b. device_tokens — one row per (user, installed device) for push
--     notifications. A member's device registers its FCM token here after
--     login; the admin-only send-notification Edge Function reads every row
--     to broadcast to all installs.
-- ---------------------------------------------------------------------------
create table if not exists public.device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  fcm_token text not null unique,
  platform text not null default 'android',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists device_tokens_user_id_idx on public.device_tokens (user_id);

-- ---------------------------------------------------------------------------
-- 3. poll_votes — normalized so RLS can protect individual votes
-- ---------------------------------------------------------------------------
create table if not exists public.poll_votes (
  id text primary key,
  poll_id text not null references public.polls (id) on delete cascade,
  member_uid text not null,
  member_name text not null,
  member_mobile text,
  option_id text not null,
  option_text text not null,
  voted_at text not null,
  timestamp bigint not null,
  comment text,
  updated_at timestamptz not null default now()
);

create index if not exists poll_votes_poll_id_idx on public.poll_votes (poll_id);
create index if not exists poll_votes_member_uid_idx on public.poll_votes (member_uid);

-- ---------------------------------------------------------------------------
-- 4. Helper functions used by RLS policies
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.current_member_uid()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select member_uid from public.profiles where id = auth.uid();
$$;

create or replace function public.is_treasurer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'treasurer'
  );
$$;

-- Migration: widen the role check constraint on an already-existing
-- `profiles` table to allow 'treasurer' (the `create table if not exists`
-- above only applies on a brand-new table, so existing installs need this
-- explicit ALTER). Safe to re-run.
do $$
begin
  alter table public.profiles drop constraint if exists profiles_role_check;
  alter table public.profiles add constraint profiles_role_check
    check (role in ('admin', 'treasurer', 'member'));
exception when others then
  null;
end $$;

-- ---------------------------------------------------------------------------
-- 5. Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.members enable row level security;
alter table public.deposits enable row level security;
alter table public.bank_entries enable row level security;
alter table public.invest_entries enable row level security;
alter table public.fund_income enable row level security;
alter table public.expenses enable row level security;
alter table public.notifications enable row level security;
alter table public.polls enable row level security;
alter table public.profit_distributions enable row level security;
alter table public.app_settings enable row level security;
alter table public.poll_votes enable row level security;
alter table public.device_tokens enable row level security;

-- profiles: everyone can see their own profile; admins can see everyone's
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_write" on public.profiles;
create policy "profiles_write" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- Generic data tables: any signed-in member/admin can read;
-- only admins can write. (Member logins are provisioned server-side by the
-- admin-manage-login edge function, which uses the service role key and
-- therefore bypasses RLS entirely — so this policy only governs the
-- browser client.)
-- NOTE: 'deposits', 'bank_entries', 'invest_entries', 'fund_income',
-- 'expenses' and 'polls' are handled separately below (treasurer/general
-- secretary can INSERT into those, but update/delete stays admin-only).
do $$
declare
  t text;
begin
  foreach t in array array[
    'members', 'notifications', 'profit_distributions', 'app_settings'
  ]
  loop
    execute format('drop policy if exists "%s_select" on public.%I', t, t);
    execute format(
      'create policy "%s_select" on public.%I for select using (auth.role() = ''authenticated'')',
      t, t
    );
    execute format('drop policy if exists "%s_write" on public.%I', t, t);
    execute format(
      'create policy "%s_write" on public.%I for all using (public.is_admin()) with check (public.is_admin())',
      t, t
    );
  end loop;
end $$;

-- Treasurer/General Secretary tables: Super Admin has full access; the
-- Treasurer/General Secretary role may only INSERT new entries (matching
-- the "Add Deposit" / "New Bank Entry" / "New Investment Entry" /
-- Organization Fund & Expenses / "New Vote Entry" buttons the app exposes
-- to that role) — updating or deleting existing records stays admin-only,
-- same as the app's own UI (delete buttons are admin-gated everywhere).
do $$
declare
  t text;
begin
  foreach t in array array[
    'deposits', 'bank_entries', 'invest_entries', 'fund_income', 'expenses', 'polls'
  ]
  loop
    execute format('drop policy if exists "%s_select" on public.%I', t, t);
    execute format(
      'create policy "%s_select" on public.%I for select using (auth.role() = ''authenticated'')',
      t, t
    );
    execute format('drop policy if exists "%s_write" on public.%I', t, t);
    execute format('drop policy if exists "%s_insert" on public.%I', t, t);
    execute format(
      'create policy "%s_insert" on public.%I for insert with check (public.is_admin() or public.is_treasurer())',
      t, t
    );
    execute format('drop policy if exists "%s_update" on public.%I', t, t);
    execute format(
      'create policy "%s_update" on public.%I for update using (public.is_admin()) with check (public.is_admin())',
      t, t
    );
    execute format('drop policy if exists "%s_delete" on public.%I', t, t);
    execute format(
      'create policy "%s_delete" on public.%I for delete using (public.is_admin())',
      t, t
    );
  end loop;
end $$;

-- poll_votes: everyone signed in can read (voter audit roll / live results);
-- a member may insert/update ONLY their own vote; only admins may delete.
drop policy if exists "poll_votes_select" on public.poll_votes;
create policy "poll_votes_select" on public.poll_votes
  for select using (auth.role() = 'authenticated');

drop policy if exists "poll_votes_insert" on public.poll_votes;
create policy "poll_votes_insert" on public.poll_votes
  for insert with check (public.is_admin() or member_uid = public.current_member_uid());

drop policy if exists "poll_votes_update" on public.poll_votes;
create policy "poll_votes_update" on public.poll_votes
  for update using (public.is_admin() or member_uid = public.current_member_uid())
  with check (public.is_admin() or member_uid = public.current_member_uid());

drop policy if exists "poll_votes_delete" on public.poll_votes;
create policy "poll_votes_delete" on public.poll_votes
  for delete using (public.is_admin());

-- device_tokens: a signed-in user may register/update/remove ONLY their own
-- device token; only admins may list every token (the send-notification
-- Edge Function itself uses the service role key, which bypasses RLS).
drop policy if exists "device_tokens_select" on public.device_tokens;
create policy "device_tokens_select" on public.device_tokens
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "device_tokens_insert" on public.device_tokens;
create policy "device_tokens_insert" on public.device_tokens
  for insert with check (user_id = auth.uid());

drop policy if exists "device_tokens_update" on public.device_tokens;
create policy "device_tokens_update" on public.device_tokens
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "device_tokens_delete" on public.device_tokens;
create policy "device_tokens_delete" on public.device_tokens
  for delete using (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- 6. Realtime — so all open devices auto-refresh when data changes
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'members', 'deposits', 'bank_entries', 'invest_entries',
    'fund_income', 'expenses', 'notifications', 'polls',
    'profit_distributions', 'app_settings', 'poll_votes'
  ]
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then
      null; -- already added, ignore
    end;
  end loop;
end $$;

-- ============================================================================
-- Done. Next step: create your first ADMIN account.
-- See README-SUPABASE.md → "Bootstrap the first admin" for the exact steps.
-- ============================================================================
