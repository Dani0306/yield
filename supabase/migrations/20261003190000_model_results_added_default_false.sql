-- New results start unselected. The CSV import leaves "added" empty (NULL),
-- which the app's unselected list (added = false) wouldn't match.
update public.model_results set added = false where added is null;
alter table public.model_results alter column added set default false;
