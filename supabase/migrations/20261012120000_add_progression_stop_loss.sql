-- Stop-loss: a progression closes as 'lost' once it has this many lost bets,
-- and the next bet starts a new progression at 1 unit. It caps what one bad
-- run can cost (8 losses at ×1.5 = 49.26 units) instead of risking the
-- whole bankroll.

-- The user's setting, changed in Settings.
alter table public.profiles
  add column max_losses smallint not null default 8
    check (max_losses between 1 and 20);

-- Each progression keeps the limit it started with, so changing the setting
-- can't stretch a progression that's already running. null: no limit (the
-- progressions closed before the stop-loss existed).
alter table public.progressions
  add column max_losses smallint check (max_losses > 0);

-- New progressions take the owner's current setting.
create function private.set_progression_max_losses()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.max_losses is null then
    select max_losses
    into new.max_losses
    from public.profiles
    where id = new.user_id;
  end if;
  return new;
end;
$$;

create trigger set_progression_max_losses
  before insert on public.progressions
  for each row execute function private.set_progression_max_losses();

-- The progression running now takes the limit from today.
update public.progressions p
set max_losses = pr.max_losses
from public.profiles pr
where pr.id = p.user_id
  and p.status = 'active';

-- Expose the limit on the stats view (new columns go last).
create or replace view public.progression_stats
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
  coalesce(sum(b.profit_units), 0) as profit_units,
  p.number as progression_number,
  p.max_losses
from public.progressions p
left join public.bets b on b.progression_id = p.id
group by p.id;
