-- Adds DepEd teacher specialization and qualified-subject metadata.
-- Run in Supabase SQL editor before using the DepEd teacher profile fields.

alter table public.org_users
  add column if not exists teacher_major text,
  add column if not exists qualified_subjects jsonb not null default '[]'::jsonb,
  add column if not exists preferred_subject text,
  add column if not exists teacher_setup_details jsonb not null default '{}'::jsonb;

create index if not exists org_users_org_teacher_major_idx
  on public.org_users (org_id, teacher_major);
