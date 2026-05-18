-- Seeds split Higher Ed academic operation roles for existing organizations.
-- Run in Supabase SQL editor after tenant feature access scripts.

insert into public.roles (
  org_id,
  key,
  name,
  description,
  is_system,
  created_at,
  updated_at
)
select
  org.id,
  role_definition.key,
  role_definition.name,
  role_definition.description,
  true,
  now(),
  now()
from public.organizations org
cross join (
  values
    ('subject_manager', 'Subject Manager', 'Creates subjects and submits them for academic approval.'),
    ('room_manager', 'Room Manager', 'Creates rooms and assigns approved subjects to room schedules.')
) as role_definition(key, name, description)
where org.institution_type = 'higher_ed'
on conflict (org_id, key)
do update set
  name = excluded.name,
  description = excluded.description,
  is_system = true,
  updated_at = now();

insert into public.role_feature_permissions (
  role_id,
  feature_key,
  enabled,
  created_at,
  updated_at
)
select
  role_row.id,
  permission.feature_key,
  true,
  now(),
  now()
from public.roles role_row
join public.organizations org on org.id = role_row.org_id
join (
  values
    ('subject_manager', 'higher-subject-management'),
    ('room_manager', 'higher-room-schedule-management')
) as permission(role_key, feature_key) on permission.role_key = role_row.key
where org.institution_type = 'higher_ed'
on conflict (role_id, feature_key)
do update set
  enabled = true,
  updated_at = now();

update public.roles role_row
set
  description = 'Manages program faculty loads and reviews teaching schedules.',
  updated_at = now()
from public.organizations org
where role_row.org_id = org.id
  and org.institution_type = 'higher_ed'
  and role_row.key = 'department_head';

update public.role_feature_permissions permission
set
  enabled = false,
  updated_at = now()
from public.roles role_row
join public.organizations org on org.id = role_row.org_id
where permission.role_id = role_row.id
  and org.institution_type = 'higher_ed'
  and role_row.key = 'department_head'
  and permission.feature_key in (
    'higher-subject-management',
    'higher-room-schedule-management'
  );

update public.role_feature_permissions permission
set
  enabled = false,
  updated_at = now()
from public.roles role_row
join public.organizations org on org.id = role_row.org_id
where permission.role_id = role_row.id
  and org.institution_type = 'higher_ed'
  and permission.feature_key in (
    'higher-subject-room-assignment',
    'higher-room-schedule-calendar'
  );

update public.roles role_row
set
  is_system = false,
  description = 'Deprecated role. Subject-room assignment has been removed from the app.',
  updated_at = now()
from public.organizations org
where role_row.org_id = org.id
  and org.institution_type = 'higher_ed'
  and role_row.key = 'subject_room_assigner';
