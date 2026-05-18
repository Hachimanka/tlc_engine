-- Allows custom roles to declare whether accounts under that role need a department.
-- Run in Supabase SQL editor before using the custom-role department requirement UI.

alter table public.roles
  add column if not exists requires_department boolean not null default false;

create index if not exists roles_org_requires_department_idx
  on public.roles (org_id, requires_department);

-- Keep the existing department-scoped system roles explicit in the database.
update public.roles
set
  requires_department = true,
  updated_at = now()
where key in (
  'faculty',
  'teacher',
  'department_head',
  'load_manager',
  'subject_room_manager',
  'load_admin'
);
