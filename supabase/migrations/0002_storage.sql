-- ============================================================================
-- PostPilot — storage bucket for uploaded / generated media
-- Object path convention:  <workspace_id>/<uuid>.<ext>
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  false,
  536870912, -- 512 MB
  array[
    'image/jpeg','image/png','image/webp','image/gif',
    'video/mp4','video/quicktime','video/webm'
  ]
)
on conflict (id) do nothing;

-- Members of the workspace named by the first path segment may read.
create policy "media read for workspace members"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'media'
    and public.is_workspace_member(((storage.foldername(name))[1])::uuid)
  );

-- Editors+ may upload / update / delete within their workspace folder.
create policy "media insert for workspace editors"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'media'
    and public.has_workspace_role(
      ((storage.foldername(name))[1])::uuid,
      array['OWNER','ADMIN','EDITOR']::public.workspace_role[]
    )
  );

create policy "media update for workspace editors"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'media'
    and public.has_workspace_role(
      ((storage.foldername(name))[1])::uuid,
      array['OWNER','ADMIN','EDITOR']::public.workspace_role[]
    )
  );

create policy "media delete for workspace editors"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'media'
    and public.has_workspace_role(
      ((storage.foldername(name))[1])::uuid,
      array['OWNER','ADMIN','EDITOR']::public.workspace_role[]
    )
  );
