-- Moves tenant feature access from roles to individual accounts.
-- Run in Supabase SQL editor before deploying per-account feature access UI.

create table if not exists public.org_user_feature_permissions (
  id uuid primary key default gen_random_uuid(),
  org_user_id uuid not null references public.org_users(id) on delete cascade,
  feature_key text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists org_user_feature_permissions_user_feature_unique
  on public.org_user_feature_permissions (org_user_id, feature_key);

create index if not exists org_user_feature_permissions_org_user_id_idx
  on public.org_user_feature_permissions (org_user_id);

-- Preserve existing behavior by copying each user's current role features.
insert into public.org_user_feature_permissions (
  org_user_id,
  feature_key,
  enabled,
  created_at,
  updated_at
)
select
  ou.id,
  rfp.feature_key,
  rfp.enabled,
  now(),
  now()
from public.org_users ou
join public.roles r on r.id = ou.role_id
join public.role_feature_permissions rfp on rfp.role_id = r.id
where r.key <> 'org_admin'
  and rfp.enabled = true
on conflict (org_user_id, feature_key) do update
set
  enabled = excluded.enabled,
  updated_at = now();

alter table public.org_user_feature_permissions enable row level security;

drop policy if exists "Org user feature permissions viewable by org members" on public.org_user_feature_permissions;
create policy "Org user feature permissions viewable by org members"
  on public.org_user_feature_permissions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.org_users target_user
      join public.org_users current_user on current_user.org_id = target_user.org_id
      where target_user.id = org_user_feature_permissions.org_user_id
        and current_user.auth_user_id = auth.uid()
    )
  );

drop policy if exists "Org user feature permissions writable by org admins" on public.org_user_feature_permissions;
create policy "Org user feature permissions writable by org admins"
  on public.org_user_feature_permissions
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.org_users target_user
      join public.org_users admin_user on admin_user.org_id = target_user.org_id
      join public.roles admin_role on admin_role.id = admin_user.role_id
      where target_user.id = org_user_feature_permissions.org_user_id
        and admin_user.auth_user_id = auth.uid()
        and admin_role.key = 'org_admin'
    )
  )
  with check (
    exists (
      select 1
      from public.org_users target_user
      join public.org_users admin_user on admin_user.org_id = target_user.org_id
      join public.roles admin_role on admin_role.id = admin_user.role_id
      where target_user.id = org_user_feature_permissions.org_user_id
        and admin_user.auth_user_id = auth.uid()
        and admin_role.key = 'org_admin'
    )
  );
