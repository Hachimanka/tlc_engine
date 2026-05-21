-- Persists Higher Ed faculty teaching load assignments.
-- Run in Supabase SQL editor after 20260512_academic_rooms_assignments.sql.

create table if not exists public.academic_faculty_load_assignments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  faculty_org_user_id uuid not null
    constraint academic_faculty_load_assignments_faculty_org_user_id_fkey
    references public.org_users(id) on delete cascade,
  room_assignment_id uuid not null
    constraint academic_faculty_load_assignments_room_assignment_id_fkey
    references public.academic_room_assignments(id) on delete cascade,
  created_by_org_user_id uuid
    constraint academic_faculty_load_assignments_created_by_org_user_id_fkey
    references public.org_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists academic_faculty_load_assignments_unique
  on public.academic_faculty_load_assignments (org_id, faculty_org_user_id, room_assignment_id);

create index if not exists academic_faculty_load_assignments_org_faculty_idx
  on public.academic_faculty_load_assignments (org_id, faculty_org_user_id);

create index if not exists academic_faculty_load_assignments_room_assignment_idx
  on public.academic_faculty_load_assignments (room_assignment_id);

alter table public.academic_faculty_load_assignments enable row level security;

-- The app reads/writes this table through service-role API routes after
-- verifying tenant membership and role permissions server-side.
