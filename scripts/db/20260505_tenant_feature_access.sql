-- Adds institution setup storage and role-based feature access.
-- Run in Supabase SQL editor after 20260504_org_roles_users.sql.

alter table public.organizations
  add column if not exists institution_type text;

alter table public.organizations
  add column if not exists onboarding_config jsonb not null default '{}'::jsonb;

create table if not exists public.role_feature_permissions (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.roles(id) on delete cascade,
  feature_key text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists role_feature_permissions_role_feature_unique
  on public.role_feature_permissions (role_id, feature_key);

create index if not exists role_feature_permissions_role_id_idx
  on public.role_feature_permissions (role_id);

alter table public.role_feature_permissions enable row level security;

create policy "Role feature permissions viewable by org members"
  on public.role_feature_permissions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.roles r
      join public.org_users ou on ou.org_id = r.org_id
      where r.id = role_feature_permissions.role_id
        and ou.auth_user_id = auth.uid()
    )
  );

create policy "Role feature permissions writable by org admins"
  on public.role_feature_permissions
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.roles target_role
      join public.org_users admin_user on admin_user.org_id = target_role.org_id
      join public.roles admin_role on admin_role.id = admin_user.role_id
      where target_role.id = role_feature_permissions.role_id
        and admin_user.auth_user_id = auth.uid()
        and admin_role.key = 'org_admin'
    )
  )
  with check (
    exists (
      select 1
      from public.roles target_role
      join public.org_users admin_user on admin_user.org_id = target_role.org_id
      join public.roles admin_role on admin_role.id = admin_user.role_id
      where target_role.id = role_feature_permissions.role_id
        and admin_user.auth_user_id = auth.uid()
        and admin_role.key = 'org_admin'
    )
  );
