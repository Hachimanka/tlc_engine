-- Prunes existing Higher Ed VPAA role permissions to match the app defaults.
-- Run in Supabase SQL editor if an organization already seeded VPAA permissions
-- before the defaults were narrowed.

update public.roles role_row
set
  description = 'Reviews final academic approvals and monitors teaching load schedules.',
  updated_at = now()
from public.organizations org
where role_row.org_id = org.id
  and org.institution_type = 'higher_ed'
  and role_row.key = 'vpaa';

update public.role_feature_permissions permission
set
  enabled = false,
  updated_at = now()
from public.roles role_row
join public.organizations org on org.id = role_row.org_id
where permission.role_id = role_row.id
  and org.institution_type = 'higher_ed'
  and role_row.key = 'vpaa'
  and permission.feature_key in (
    'higher-faculty-load-assignment',
    'higher-subject-management',
    'higher-room-schedule-management'
  );

insert into public.role_feature_permissions (
  role_id,
  feature_key,
  enabled,
  created_at,
  updated_at
)
select
  role_row.id,
  feature.feature_key,
  true,
  now(),
  now()
from public.roles role_row
join public.organizations org on org.id = role_row.org_id
cross join (
  values
    ('higher-dean-vpaa-approvals'),
    ('higher-teaching-load-view')
) as feature(feature_key)
where org.institution_type = 'higher_ed'
  and role_row.key = 'vpaa'
on conflict (role_id, feature_key)
do update set
  enabled = true,
  updated_at = now();
