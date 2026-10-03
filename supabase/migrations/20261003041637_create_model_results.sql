-- model_results: draw candidates produced by the prediction model,
-- one row per match per scrape. Columns mirror the model's CSV export.
-- Model outputs use plain numeric so values are stored exactly as exported.

create table public.model_results (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,

  -- Match
  home_team text not null,
  away_team text not null,
  league text not null,
  league_id text not null,                 -- e.g. argentina/primera-b
  game_date text not null,                 -- raw kick-off from the source, e.g. "03.10. 15:00"
  match_date date not null,
  scraped_at timestamptz not null,

  -- Headline output
  draw_percentage numeric not null check (draw_percentage between 0 and 100),
  prob numeric not null check (prob between 0 and 1),
  prob_poisson numeric check (prob_poisson between 0 and 1),
  score numeric,
  rank_gap integer,

  -- Expected goals and team strengths
  lambda_home numeric,
  lambda_away numeric,
  home_att numeric,
  home_def numeric,
  away_att numeric,
  away_def numeric,
  att_delta numeric,

  -- Draw history (percentages, 0–100)
  home_draw_pct numeric check (home_draw_pct between 0 and 100),
  away_draw_pct numeric check (away_draw_pct between 0 and 100),
  league_draw_rate numeric check (league_draw_rate between 0 and 1),
  rho numeric,                             -- Dixon–Coles ρ

  -- Sample sizes and model details
  home_games integer check (home_games >= 0),
  away_games integer check (away_games >= 0),
  home_used_split boolean,
  away_used_split boolean,
  method text,

  created_at timestamptz not null default now(),

  -- Importing the same scrape twice doesn't duplicate rows.
  unique (user_id, match_date, home_team, away_team, scraped_at)
);

create index model_results_user_id_match_date_idx
  on public.model_results (user_id, match_date);

-- Access: signed-in users only, own rows only.
revoke all on public.model_results from anon;
grant select, insert, update, delete on public.model_results to authenticated;

alter table public.model_results enable row level security;

create policy "Users can view their own model results" on public.model_results
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their own model results" on public.model_results
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own model results" on public.model_results
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their own model results" on public.model_results
  for delete to authenticated using ((select auth.uid()) = user_id);
