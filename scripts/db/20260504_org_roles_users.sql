-- Creates org roles and org users for multi-tenant access.
-- Run in Supabase SQL editor.

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  key text not null,
  name text not null,
  description text,
  is_system boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists roles_org_key_unique on public.roles (org_id, key);
create index if not exists roles_org_id_idx on public.roles (org_id);

create table if not exists public.org_users (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete restrict,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  employee_id text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists org_users_auth_user_unique on public.org_users (auth_user_id);
create unique index if not exists org_users_org_email_unique on public.org_users (org_id, email);
create unique index if not exists org_users_org_employee_unique on public.org_users (org_id, employee_id)
  where employee_id is not null;
create index if not exists org_users_org_id_idx on public.org_users (org_id);
create index if not exists org_users_role_id_idx on public.org_users (role_id);

alter table public.roles enable row level security;
alter table public.org_users enable row level security;

create policy "Roles are viewable by org members"
  on public.roles
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.org_users ou
      where ou.org_id = roles.org_id
        and ou.auth_user_id = auth.uid()
    )
  );

create policy "Org users viewable by org members"
  on public.org_users
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.org_users ou
      where ou.org_id = org_users.org_id
        and ou.auth_user_id = auth.uid()
    )
  );
