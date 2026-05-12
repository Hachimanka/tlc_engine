-- Adds manual department assignment for tenant faculty/staff accounts.
-- Run in Supabase SQL editor before using department-required account creation.

alter table public.org_users
  add column if not exists department text;

create index if not exists org_users_org_department_idx
  on public.org_users (org_id, department);
