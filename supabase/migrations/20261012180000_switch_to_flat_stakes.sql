-- Flat stakes: every bet stakes the same share of the bankroll, whatever
-- happened before it. Progressions stop here: new bets belong to none, and
-- the progressions played so far stay as history.

-- The stake, as a % of the bankroll (1% of 1.000.000 → 10.000 a bet).
alter table public.profiles
  add column stake_percent numeric(4, 2) not null default 1
    check (stake_percent > 0 and stake_percent <= 10);

-- The stop-loss only made sense inside a progression. Old progressions keep
-- the limit they ran with (progressions.max_losses).
drop trigger set_progression_max_losses on public.progressions;
drop function private.set_progression_max_losses();
alter table public.profiles drop column max_losses;

-- Bets no longer need a progression. Old bets keep theirs and their attempt
-- number; new bets have neither.
alter table public.bets
  alter column progression_id drop not null,
  alter column attempt_number drop not null,
  add constraint bets_progression_attempt_check
    check ((progression_id is null) = (attempt_number is null));

-- Close what's still open: the empty progression waiting for its first bet
-- goes, and one with bets ends as abandoned.
delete from public.progressions p
where p.status = 'active'
  and not exists (select 1 from public.bets b where b.progression_id = p.id);

update public.progressions p
set status = 'abandoned',
    end_date = greatest(
      p.start_date,
      (select max(b.match_date) from public.bets b where b.progression_id = p.id)
    )
where p.status = 'active';

-- Reminders: several bets can be open at once now, so a pending bet no
-- longer holds back the reminder for a match that starts before it ends.
create or replace function private.due_reminder_ids()
returns setof bigint
language sql
stable
set search_path = ''
as $$
  select r.id
  from public.model_results r
  where r.added
    and r.reminder_sent_at is null
    and r.kick_off > now()
    and r.kick_off <= now() + interval '10 minutes'
    and not exists (
      select 1 from public.bets b where b.model_result_id = r.id
    )
    and exists (select 1 from public.profiles where email_reminders);
$$;
