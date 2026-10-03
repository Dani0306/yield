-- Remove the columns added on top of the CSV (id, user_id, created_at),
-- so model_results matches the model's export exactly.
-- Without user_id, rows can't be scoped per user: any signed-in user can
-- read and write them (fine for a single-user app with sign-ups disabled).

drop policy "Users can view their own model results" on public.model_results;
drop policy "Users can create their own model results" on public.model_results;
drop policy "Users can update their own model results" on public.model_results;
drop policy "Users can delete their own model results" on public.model_results;

alter table public.model_results
  drop column id,
  drop column user_id,
  drop column created_at;

-- Importing the same scrape twice doesn't duplicate rows.
alter table public.model_results
  add constraint model_results_match_scrape_key
  unique (match_date, home_team, away_team, scraped_at);

create index model_results_match_date_idx on public.model_results (match_date);

create policy "Signed-in users can view model results" on public.model_results
  for select to authenticated using (true);
create policy "Signed-in users can add model results" on public.model_results
  for insert to authenticated with check (true);
create policy "Signed-in users can update model results" on public.model_results
  for update to authenticated using (true) with check (true);
create policy "Signed-in users can delete model results" on public.model_results
  for delete to authenticated using (true);
