-- Adds database-backed Higher Ed academic approval workflow.
-- Run in Supabase SQL editor after the tenant roles/users scripts.

create table if not exists public.academic_subjects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  approval_request_id uuid,
  subject_title text not null,
  subject_code text not null,
  department text not null,
  year_level text,
  lecture_hours numeric not null default 0,
  lab_hours numeric not null default 0,
  meetings_per_week integer not null default 2 check (meetings_per_week > 0),
  units numeric not null default 0,
  description text,
  created_by_org_user_id uuid references public.org_users(id) on delete set null,
  approved_by_org_user_id uuid references public.org_users(id) on delete set null,
  approved_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists academic_subjects_org_code_unique
  on public.academic_subjects (org_id, lower(subject_code));

create index if not exists academic_subjects_org_id_idx
  on public.academic_subjects (org_id);

create table if not exists public.academic_approval_requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  request_type text not null
    check (request_type in (
      'subject',
      'teaching_load',
      'schedule_conflict',
      'overload_exception',
      'adjustment_request'
    )),
  status text not null default 'pending_dean'
    check (status in (
      'pending_dean',
      'pending_vpaa',
      'approved',
      'returned',
      'rejected'
    )),
  title text not null,
  target_label text,
  payload jsonb not null default '{}'::jsonb,
  submitted_by_org_user_id uuid references public.org_users(id) on delete set null,
  reviewed_by_dean_org_user_id uuid references public.org_users(id) on delete set null,
  reviewed_by_vpaa_org_user_id uuid references public.org_users(id) on delete set null,
  dean_remarks text,
  vpaa_remarks text,
  decision_history jsonb not null default '[]'::jsonb,
  submitted_at timestamptz not null default now(),
  dean_reviewed_at timestamptz,
  vpaa_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists academic_approval_requests_org_id_idx
  on public.academic_approval_requests (org_id);

create index if not exists academic_approval_requests_status_idx
  on public.academic_approval_requests (status);

create index if not exists academic_approval_requests_type_idx
  on public.academic_approval_requests (request_type);

alter table public.academic_subjects enable row level security;
alter table public.academic_approval_requests enable row level security;

-- The app reads/writes these tables through service-role API routes after
-- verifying tenant membership and role permissions server-side.
