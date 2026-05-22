-- Adds configurable Higher Ed approval workflow support.
-- Run in Supabase SQL editor after 20260512_academic_approvals.sql.

alter table public.academic_approval_requests
  add column if not exists reviewed_by_chairman_org_user_id uuid references public.org_users(id) on delete set null,
  add column if not exists chairman_remarks text,
  add column if not exists chairman_reviewed_at timestamptz;

alter table public.academic_approval_requests
  drop constraint if exists academic_approval_requests_status_check;

alter table public.academic_approval_requests
  add constraint academic_approval_requests_status_check
  check (status in (
    'pending_chairman',
    'pending_dean',
    'pending_vpaa',
    'approved',
    'returned',
    'rejected'
  ));
-- Adds configurable Higher Ed approval workflow support.
-- Run in Supabase SQL editor after 20260512_academic_approvals.sql.

alter table public.academic_approval_requests
  add column if not exists reviewed_by_chairman_org_user_id uuid references public.org_users(id) on delete set null,
  add column if not exists chairman_remarks text,
  add column if not exists chairman_reviewed_at timestamptz;

alter table public.academic_approval_requests
  drop constraint if exists academic_approval_requests_status_check;

alter table public.academic_approval_requests
  add constraint academic_approval_requests_status_check
  check (status in (
    'pending_chairman',
    'pending_dean',
    'pending_vpaa',
    'approved',
    'returned',
    'rejected'
  ));
