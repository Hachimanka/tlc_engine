-- Adds how many weekly meetings each Higher Ed subject should have.
-- Run in Supabase SQL editor after 20260512_academic_approvals.sql.

alter table public.academic_subjects
  add column if not exists meetings_per_week integer;

update public.academic_subjects
set meetings_per_week = 2
where meetings_per_week is null;

alter table public.academic_subjects
  alter column meetings_per_week set default 2,
  alter column meetings_per_week set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'academic_subjects_meetings_per_week_positive'
  ) then
    alter table public.academic_subjects
      add constraint academic_subjects_meetings_per_week_positive
      check (meetings_per_week > 0);
  end if;
end $$;
