-- A per-user progression number (1, 2, 3…) to show in the app. The id is an
-- identity column: Postgres never reuses a value, so ids skip numbers after
-- a deleted row or a failed insert and can't be used as a count.

alter table public.progressions add column number int;

-- Existing progressions: numbered by start date.
update public.progressions p
set number = n.number
from (
  select id, row_number() over (partition by user_id order by start_date, id) as number
  from public.progressions
) n
where n.id = p.id;

alter table public.progressions
  alter column number set not null,
  add constraint progressions_user_id_number_key unique (user_id, number);

-- New progressions: the user's highest number + 1. The unique constraint
-- rejects the rare clash of two progressions created at the same moment.
create function private.set_progression_number()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  select coalesce(max(number), 0) + 1
  into new.number
  from public.progressions
  where user_id = new.user_id;
  return new;
end;
$$;

create trigger set_progression_number
  before insert on public.progressions
  for each row execute function private.set_progression_number();

-- Expose the number on the stats view (new columns go last).
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
  p.number as progression_number
from public.progressions p
left join public.bets b on b.progression_id = p.id
group by p.id;
