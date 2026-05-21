-- Adds sidebar access for DepEd subject approvals.
-- DepEd subject approval records reuse public.academic_approval_requests
-- and approved records reuse public.academic_subjects.
-- Run in Supabase SQL editor after 20260512_academic_approvals.sql.

insert into public.role_feature_permissions (role_id, feature_key, enabled, created_at, updated_at)
select r.id, 'deped-subject-approvals', true, now(), now()
from public.roles r
join public.organizations o on o.id = r.org_id
where o.institution_type = 'deped'
  and r.key in ('school_head', 'principal', 'org_admin')
on conflict (role_id, feature_key)
do update set enabled = excluded.enabled, updated_at = now();

insert into public.org_user_feature_permissions (org_user_id, feature_key, enabled, created_at, updated_at)
select ou.id, 'deped-subject-approvals', true, now(), now()
from public.org_users ou
join public.roles r on r.id = ou.role_id
join public.organizations o on o.id = ou.org_id
where o.institution_type = 'deped'
  and r.key in ('school_head', 'principal', 'org_admin')
on conflict (org_user_id, feature_key)
do update set enabled = excluded.enabled, updated_at = now();
