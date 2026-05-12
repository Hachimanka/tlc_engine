-- Adds database-backed Higher Ed room and subject-room assignment workflows.
-- Run in Supabase SQL editor after 20260512_academic_approvals.sql.

create table if not exists public.academic_rooms (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  room_name text not null,
  building text not null,
  room_type text not null default 'Lecture Room',
  capacity integer not null default 1 check (capacity > 0),
  status text not null default 'available'
    check (status in ('available', 'occupied', 'under_maintenance')),
  created_by_org_user_id uuid references public.org_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists academic_rooms_org_name_building_unique
  on public.academic_rooms (org_id, lower(room_name), lower(building));

create index if not exists academic_rooms_org_id_idx
  on public.academic_rooms (org_id);

create table if not exists public.academic_room_assignments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  subject_id uuid not null
    constraint academic_room_assignments_subject_id_fkey
    references public.academic_subjects(id) on delete cascade,
  room_id uuid not null
    constraint academic_room_assignments_room_id_fkey
    references public.academic_rooms(id) on delete cascade,
  section text not null,
  day_of_week text not null
    check (day_of_week in ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  start_time time not null,
  end_time time not null,
  created_by_org_user_id uuid references public.org_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (start_time < end_time)
);

alter table public.academic_room_assignments
  drop constraint if exists academic_room_assignments_faculty_org_user_id_fkey;

drop index if exists academic_room_assignments_faculty_day_idx;

-- Cleanup for databases that already ran an earlier version of this script
-- where assignments required a faculty user. The subject-room assigner now
-- assigns approved subjects to rooms only, so this old NOT NULL column must go.
do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    join unnest(con.conkey) as column_number on true
    join pg_attribute attr
      on attr.attrelid = con.conrelid
      and attr.attnum = column_number
    where nsp.nspname = 'public'
      and rel.relname = 'academic_room_assignments'
      and attr.attname = 'faculty_org_user_id'
  loop
    execute format(
      'alter table public.academic_room_assignments drop constraint if exists %I',
      constraint_name
    );
  end loop;
end $$;

alter table public.academic_room_assignments
  drop column if exists faculty_org_user_id;

-- Refresh older day constraints so Sunday can be assigned.
do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    join unnest(con.conkey) as column_number on true
    join pg_attribute attr
      on attr.attrelid = con.conrelid
      and attr.attnum = column_number
    where nsp.nspname = 'public'
      and rel.relname = 'academic_room_assignments'
      and attr.attname = 'day_of_week'
      and con.contype = 'c'
  loop
    execute format(
      'alter table public.academic_room_assignments drop constraint if exists %I',
      constraint_name
    );
  end loop;
end $$;

alter table public.academic_room_assignments
  add constraint academic_room_assignments_day_of_week_check
  check (day_of_week in ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'));

create index if not exists academic_room_assignments_org_id_idx
  on public.academic_room_assignments (org_id);

create index if not exists academic_room_assignments_room_day_idx
  on public.academic_room_assignments (org_id, room_id, day_of_week);

alter table public.academic_rooms enable row level security;
alter table public.academic_room_assignments enable row level security;

-- The app reads/writes these tables through service-role API routes after
-- verifying tenant membership and role permissions server-side.
