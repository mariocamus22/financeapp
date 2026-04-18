-- Tablas alineadas con FinanceRepository (céntimos, JSON donde aplica).
-- Aplicar en Supabase: SQL Editor → pegar → Run, o `supabase db push`.

create table if not exists public.finance_platforms (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null check (type in ('LIQUIDITY', 'INVESTMENT')),
  color text not null,
  icon text not null,
  sort_order integer not null default 0,
  active boolean not null default true
);

create table if not exists public.finance_asset_types (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  monthly_target_cents integer not null default 0,
  color text not null,
  icon text not null,
  sort_order integer not null default 0,
  active boolean not null default true
);

create table if not exists public.finance_income_types (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  active boolean not null default true
);

create table if not exists public.finance_expense_types (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  monthly_budget_cents integer not null default 0,
  color text not null,
  icon text not null,
  sort_order integer not null default 0,
  active boolean not null default true
);

create table if not exists public.finance_goals (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  target_amount_cents integer not null,
  target_year integer not null,
  type text not null check (type in ('PATRIMONY', 'INVESTMENT', 'ASSET')),
  asset_type_id text,
  sort_order integer not null default 0,
  active boolean not null default true
);

create table if not exists public.finance_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  emergency_fund_target_cents integer not null default 0,
  current_year integer not null,
  previous_capital_by_asset jsonb not null default '{}'::jsonb
);

create table if not exists public.finance_monthly_snapshots (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  month integer not null,
  year integer not null,
  total_income_cents integer not null default 0,
  total_expenses_cents integer not null default 0,
  total_invested_cents integer not null default 0,
  total_liquidity_cents integer not null default 0,
  total_investment_value_cents integer not null default 0,
  patrimonio_total_cents integer not null default 0,
  liquidity_by_platform jsonb not null default '{}'::jsonb,
  investment_value_by_asset jsonb not null default '{}'::jsonb,
  investment_capital_by_asset jsonb not null default '{}'::jsonb,
  closed_at timestamptz not null default now(),
  unique (user_id, year, month)
);

create table if not exists public.finance_transactions (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  transacted_on date not null,
  month integer not null,
  year integer not null,
  type text not null check (type in ('INCOME', 'EXPENSE', 'INVESTMENT')),
  amount_cents integer not null,
  description text not null default '',
  platform_id text not null,
  category_id text not null,
  unit_price_cents integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists finance_transactions_user_year_month_idx
  on public.finance_transactions (user_id, year, month);
create index if not exists finance_platforms_user_idx on public.finance_platforms (user_id);
create index if not exists finance_snapshots_user_year_month_idx
  on public.finance_monthly_snapshots (user_id, year, month);

alter table public.finance_platforms enable row level security;
alter table public.finance_asset_types enable row level security;
alter table public.finance_income_types enable row level security;
alter table public.finance_expense_types enable row level security;
alter table public.finance_goals enable row level security;
alter table public.finance_settings enable row level security;
alter table public.finance_monthly_snapshots enable row level security;
alter table public.finance_transactions enable row level security;

create policy "finance_platforms_own" on public.finance_platforms
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "finance_asset_types_own" on public.finance_asset_types
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "finance_income_types_own" on public.finance_income_types
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "finance_expense_types_own" on public.finance_expense_types
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "finance_goals_own" on public.finance_goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "finance_settings_own" on public.finance_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "finance_monthly_snapshots_own" on public.finance_monthly_snapshots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "finance_transactions_own" on public.finance_transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
