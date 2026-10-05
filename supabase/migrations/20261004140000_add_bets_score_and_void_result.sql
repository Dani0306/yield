-- result can now also be 'void' (a cancelled match), so every settled bet
-- says in words how it ended. score holds the exact final score as
-- "home-away", e.g. "1-1"; empty while pending, optional for void bets.
alter table public.bets drop constraint bets_result_check;
alter table public.bets
  add constraint bets_result_check
    check (result in ('home_win', 'draw', 'away_win', 'void')),
  add column score text
    check (score ~ '^[0-9]{1,2}-[0-9]{1,2}$');
