-- First name and surname for display (sidebar user menu, initials avatar).
alter table public.profiles
  add column first_name text,
  add column last_name text;
