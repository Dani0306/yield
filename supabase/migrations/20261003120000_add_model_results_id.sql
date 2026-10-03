-- Give model_results a primary key again, so the Supabase table editor can
-- edit and delete rows. Existing rows are numbered automatically, and the
-- CSV import doesn't need an id column.
alter table public.model_results
  add column id bigint generated always as identity primary key;
