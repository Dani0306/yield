-- The bookmaker each bet was placed with. Required; the allowed names live
-- in the app (src/lib/data/bookmakers.ts) so the list can change without a
-- migration.
alter table public.bets
  add column bookmaker text not null check (length(trim(bookmaker)) > 0);
