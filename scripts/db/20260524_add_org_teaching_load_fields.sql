-- Adds fields for teaching load export functionality to organizations table.
-- Run in Supabase SQL editor.

alter table public.organizations
  add column if not exists school_year text default 'SY 2024-2025';

alter table public.organizations
  add column if not exists reviewed_by text default '—';

alter table public.organizations
  add column if not exists reviewed_position text default 'Designation/Position';

alter table public.organizations
  add column if not exists approved_by text default '—';

alter table public.organizations
  add column if not exists approved_position text default 'Acting Secondary School Principal';

alter table public.organizations
  add column if not exists address text default 'Public Schools District Supervisor';

alter table public.organizations
  add column if not exists logo_url text;
