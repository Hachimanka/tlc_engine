-- Adds Higher Ed college/department hierarchy for tenant admin.
-- Run in Supabase SQL editor before using the Colleges & Departments hierarchy UI.

create table if not exists public.org_colleges (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  code text,
  dean_user_id uuid references public.org_users(id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists org_colleges_org_id_idx
  on public.org_colleges (org_id);

create unique index if not exists org_colleges_org_code_unique
  on public.org_colleges (org_id, lower(code))
  where code is not null and btrim(code) <> '';

create table if not exists public.org_departments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  college_id uuid references public.org_colleges(id) on delete set null,
  name text not null,
  code text,
  chair_user_id uuid references public.org_users(id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists org_departments_org_id_idx
  on public.org_departments (org_id);

create index if not exists org_departments_college_id_idx
  on public.org_departments (college_id);

create unique index if not exists org_departments_org_code_unique
  on public.org_departments (org_id, lower(code))
  where code is not null and btrim(code) <> '';

alter table public.org_users
  add column if not exists department_id uuid references public.org_departments(id) on delete set null;

create index if not exists org_users_department_id_idx
  on public.org_users (department_id);

alter table public.org_colleges enable row level security;
alter table public.org_departments enable row level security;

drop policy if exists "Org colleges viewable by org members" on public.org_colleges;
create policy "Org colleges viewable by org members"
  on public.org_colleges
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.org_users ou
      where ou.org_id = org_colleges.org_id
        and ou.auth_user_id = auth.uid()
    )
  );

drop policy if exists "Org departments viewable by org members" on public.org_departments;
create policy "Org departments viewable by org members"
  on public.org_departments
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.org_users ou
      where ou.org_id = org_departments.org_id
        and ou.auth_user_id = auth.uid()
    )
  );
