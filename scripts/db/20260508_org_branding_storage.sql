-- Private storage for tenant organization logos and brand assets.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'org-brand-assets',
  'org-brand-assets',
  false,
  750000,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Org members can read their own brand assets" on storage.objects;
create policy "Org members can read their own brand assets"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'org-brand-assets'
    and exists (
      select 1
      from public.org_users ou
      where ou.auth_user_id = auth.uid()
        and ou.org_id::text = (storage.foldername(name))[1]
    )
  );
