-- Adds a department label to tenant organization accounts.
-- Nullable for backward compatibility with existing org_users rows.

alter table public.org_users
  add column if not exists department text;
