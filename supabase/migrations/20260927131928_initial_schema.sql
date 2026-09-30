-- Initial schema: profiles, progressions, bets, and the progression_stats view.
-- Every table is private to its owner via row-level security.

-- ─────────────────────────────────────────────────────────────
-- profiles: extra account details. Auth (email, password) lives in auth.users.
-- ─────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  avatar_url text,
  total_budget numeric(12, 2) not null default 0 check (total_budget >= 0),
  created_at timestamptz not null default now()
);

-- Create a profile automatically when a user signs up.
-- Lives in a non-exposed schema so it can't be called through the Data API.
create schema if not exists private;

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

revoke execute on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- progressions: a sequence of bets under the strategy.
-- ─────────────────────────────────────────────────────────────
create table public.progressions (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  status text not null default 'active'
    check (status in ('active', 'won', 'lost', 'abandoned')),
  start_date timestamptz not null default now(),
  end_date timestamptz check (end_date is null or end_date >= start_date),
  created_at timestamptz not null default now(),
  -- Lets bets reference (id, user_id) so a bet can only join its owner's progression.
  unique (id, user_id)
);

create index progressions_user_id_idx on public.progressions (user_id);

-- ─────────────────────────────────────────────────────────────
-- bets: every bet belongs to exactly one progression.
-- ─────────────────────────────────────────────────────────────
create table public.bets (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  progression_id bigint not null,
  attempt_number smallint not null check (attempt_number > 0),
  match_date timestamptz not null default now(),
  home_team text not null,
  away_team text not null,
  result text check (result in ('home_win', 'draw', 'away_win')),
  stake numeric(8, 2) not null check (stake > 0),     -- units
  amount numeric(12, 2) not null check (amount > 0),  -- money
  odds numeric(7, 3) not null check (odds > 1),
  status text not null default 'pending'
    check (status in ('pending', 'won', 'lost', 'void')),
  draw_percentage numeric(5, 2) not null check (draw_percentage between 0 and 100),
  -- Percentage points: estimated draw chance minus the bookmaker's implied chance (100 / odds).
  advantage numeric(6, 2) generated always as (round(draw_percentage - 100 / odds, 2)) stored,
  profit numeric(12, 2) generated always as (
    case status
      when 'won' then round(amount * (odds - 1), 2)
      when 'lost' then -amount
      else 0
    end
  ) stored,
  profit_units numeric(8, 2) generated always as (
    case status
      when 'won' then round(stake * (odds - 1), 2)
      when 'lost' then -stake
      else 0
    end
  ) stored,
  created_at timestamptz not null default now(),
  foreign key (progression_id, user_id)
    references public.progressions (id, user_id) on delete cascade,
  unique (progression_id, attempt_number)
);

create index bets_user_id_idx on public.bets (user_id);
create index bets_progression_id_user_id_idx on public.bets (progression_id, user_id);
create index bets_user_id_match_date_idx on public.bets (user_id, match_date);

-- ─────────────────────────────────────────────────────────────
-- progression_stats: totals computed live from each progression's bets.
-- security_invoker makes the view respect the caller's RLS.
-- ─────────────────────────────────────────────────────────────
create view public.progression_stats
with (security_invoker = true) as
select
  p.id as progression_id,
  p.user_id,
  p.status,
  p.start_date,
  p.end_date,
  count(b.id)::int as total_attempts,
  coalesce(sum(b.amount), 0) as total_bet_amount,
  coalesce(sum(b.stake), 0) as total_stake_units,
  coalesce(sum(b.profit), 0) as profit,
  coalesce(sum(b.profit_units), 0) as profit_units
from public.progressions p
left join public.bets b on b.progression_id = p.id
group by p.id;

-- ─────────────────────────────────────────────────────────────
-- Access: signed-in users only (no anonymous access), own rows only.
-- ─────────────────────────────────────────────────────────────
revoke all on public.profiles, public.progressions, public.bets, public.progression_stats from anon;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.progressions to authenticated;
grant select, insert, update, delete on public.bets to authenticated;
grant select on public.progression_stats to authenticated;

alter table public.profiles enable row level security;
alter table public.progressions enable row level security;
alter table public.bets enable row level security;

create policy "Users can view their own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "Users can update their own profile" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "Users can view their own progressions" on public.progressions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their own progressions" on public.progressions
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own progressions" on public.progressions
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their own progressions" on public.progressions
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Users can view their own bets" on public.bets
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their own bets" on public.bets
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own bets" on public.bets
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their own bets" on public.bets
  for delete to authenticated using ((select auth.uid()) = user_id);
