-- Email reminders 10 minutes before a selected match kicks off.
-- Every minute pg_cron checks for a due reminder and, only when there is
-- one, calls the send-reminders Edge Function, which sends the email
-- through Resend (supabase/functions/send-reminders).
--
-- The cron job reads two Vault secrets, created outside migrations:
--   project_url → https://<project>.supabase.co
--   anon_key    → the project's (public) anon key, to call the function

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Kick-off as a real timestamp: match_date plus the "HH:MM" at the end of
-- game_date, in Colombian time. Same rule as kickOff() in src/lib/utils/fn.ts.
alter table public.model_results
  add column kick_off timestamptz generated always as (
    timezone(
      'America/Bogota',
      match_date + make_time(
        coalesce(substring(game_date from '(\d{1,2}):\d{2}\s*$')::int, 0),
        coalesce(substring(game_date from '\d{1,2}:(\d{2})\s*$')::int, 0),
        0
      )
    )
  ) stored,
  -- Set when the reminder email goes out, so it's only sent once.
  add column reminder_sent_at timestamptz;

create index model_results_selected_kick_off_idx
  on public.model_results (kick_off) where added;

-- Lets the user turn the emails off in Settings.
alter table public.profiles
  add column email_reminders boolean not null default true;

-- Selected matches whose reminder is due: kicking off within 10 minutes,
-- not reminded yet, not bet on, and not before a pending bet's match (only
-- one bet runs at a time, the same rule as the dashboard's next event).
create function private.due_reminder_ids()
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
    and not exists (
      select 1 from public.bets p
      where p.status = 'pending' and p.match_date > r.kick_off
    )
    and exists (select 1 from public.profiles where email_reminders);
$$;

-- Marks the due reminders as sent and returns them, in one statement, so
-- two overlapping runs can't both send the same one. Only the Edge Function
-- (service role) may call it.
create function public.claim_due_reminders()
returns setof public.model_results
language sql
security definer
set search_path = ''
as $$
  update public.model_results
  set reminder_sent_at = now()
  where id in (select private.due_reminder_ids())
    and reminder_sent_at is null
  returning *;
$$;

revoke execute on function public.claim_due_reminders() from public, anon, authenticated;
grant execute on function public.claim_due_reminders() to service_role;

-- Every minute; the request is only made when a reminder is due.
select cron.schedule(
  'match-reminders',
  '* * * * *',
  $$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
        || '/functions/v1/send-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'anon_key')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 15000
    )
    where exists (select from private.due_reminder_ids());
  $$
);
