-- Adds uniqueness guarantees for organizations.slug and organizations.admin_email.
-- Run in Supabase SQL editor (or via psql) after checking for duplicates.

-- 1) Check for duplicates first (must return 0 rows before adding unique indexes).
-- select slug, count(*)
-- from public.organizations
-- group by slug
-- having count(*) > 1;

-- select admin_email, count(*)
-- from public.organizations
-- group by admin_email
-- having count(*) > 1;

-- 2) Add unique indexes (safe to re-run).
create unique index if not exists organizations_slug_unique
  on public.organizations (slug);

create unique index if not exists organizations_admin_email_unique
  on public.organizations (admin_email);
