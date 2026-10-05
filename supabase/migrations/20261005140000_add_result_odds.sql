-- Bookmaker odds for model results, collected from OddsPapi when a result is
-- selected. model_results remembers which OddsPapi fixture it was matched to
-- (null when no match was found) and when that was last checked.
alter table public.model_results
  add column odds_fixture_id text,
  add column odds_checked_at timestamptz;

-- One row per bookmaker per result: the 1X2 prices, the draw required.
create table public.result_odds (
  id bigint generated always as identity primary key,
  model_result_id bigint not null references public.model_results (id) on delete cascade,
  bookmaker text not null,
  home_odds numeric check (home_odds > 1),
  draw_odds numeric not null check (draw_odds > 1),
  away_odds numeric check (away_odds > 1),
  price_changed_at timestamptz,   -- when the bookmaker last moved the price
  fetched_at timestamptz not null default now(),
  unique (model_result_id, bookmaker)
);

-- Same access as model_results: signed-in users only (single-user app).
revoke all on public.result_odds from anon;
grant select, insert, update, delete on public.result_odds to authenticated;
alter table public.result_odds enable row level security;

create policy "Signed-in users can view result odds" on public.result_odds
  for select to authenticated using (true);
create policy "Signed-in users can add result odds" on public.result_odds
  for insert to authenticated with check (true);
create policy "Signed-in users can update result odds" on public.result_odds
  for update to authenticated using (true) with check (true);
create policy "Signed-in users can delete result odds" on public.result_odds
  for delete to authenticated using (true);
