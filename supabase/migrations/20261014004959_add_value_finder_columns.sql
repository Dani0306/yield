-- Value finder (bookmaker odds) columns from the model project's CSV.
-- All nullable, no defaults: games without odds leave them empty.
alter table public.model_results
  add column if not exists model_draw_pct numeric,
  add column if not exists best_odds numeric,
  add column if not exists best_bookmaker text,
  add column if not exists best_implied_pct numeric,
  add column if not exists avg_draw_odds numeric,
  add column if not exists bookmakers_count integer,
  add column if not exists market_fair_pct numeric,
  add column if not exists market_source text,
  add column if not exists market_margin_pct numeric,
  add column if not exists edge_pp numeric,
  add column if not exists p_blend_pct numeric,
  add column if not exists ev_pct numeric,
  add column if not exists model_ev_pct numeric,
  add column if not exists market_ev_pct numeric,
  add column if not exists fair_odds numeric,
  add column if not exists odds_fetched_at timestamptz,
  add column if not exists decision text,
  add column if not exists reason text;
