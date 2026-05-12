-- Creates the activity log table used by the superadmin audit screen.
-- Run in Supabase SQL editor.

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_name text not null,
  user_email text,
  action text not null,
  target text,
  target_type text,
  status text not null default 'success'
    check (status in ('success', 'failed', 'warning', 'info')),
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_logs_created_at_idx 
  on public.activity_logs (created_at desc);

create index if not exists activity_logs_status_idx
  on public.activity_logs (status);

create index if not exists activity_logs_target_type_idx
  on public.activity_logs (target_type);

alter table public.activity_logs enable row level security;

-- The app reads and writes this table through service-role API routes after
-- verifying the current user is a superadmin. No direct client policies needed.
