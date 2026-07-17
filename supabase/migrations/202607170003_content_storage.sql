begin;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values
  (
    'content-audio-drafts',
    'content-audio-drafts',
    false,
    26214400,
    array[
      'audio/mpeg',
      'audio/mp4',
      'audio/ogg',
      'audio/wav',
      'audio/x-wav'
    ]
  ),
  (
    'content-image-drafts',
    'content-image-drafts',
    false,
    10485760,
    array[
      'image/gif',
      'image/jpeg',
      'image/png',
      'image/webp'
    ]
  ),
  (
    'content-audio',
    'content-audio',
    true,
    26214400,
    array[
      'audio/mpeg',
      'audio/mp4',
      'audio/ogg',
      'audio/wav',
      'audio/x-wav'
    ]
  ),
  (
    'content-images',
    'content-images',
    true,
    10485760,
    array[
      'image/gif',
      'image/jpeg',
      'image/png',
      'image/webp'
    ]
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types =
    excluded.allowed_mime_types;

drop policy if exists
  "content_drafts_select_manager"
  on storage.objects;
create policy "content_drafts_select_manager"
on storage.objects for select
to authenticated
using (
  bucket_id in (
    'content-audio-drafts',
    'content-image-drafts'
  )
  and public.can_manage_content()
);

drop policy if exists
  "content_drafts_insert_editor"
  on storage.objects;
create policy "content_drafts_insert_editor"
on storage.objects for insert
to authenticated
with check (
  bucket_id in (
    'content-audio-drafts',
    'content-image-drafts'
  )
  and public.can_edit_drafts()
);

drop policy if exists
  "content_drafts_update_editor"
  on storage.objects;
create policy "content_drafts_update_editor"
on storage.objects for update
to authenticated
using (
  bucket_id in (
    'content-audio-drafts',
    'content-image-drafts'
  )
  and public.can_edit_drafts()
)
with check (
  bucket_id in (
    'content-audio-drafts',
    'content-image-drafts'
  )
  and public.can_edit_drafts()
);

drop policy if exists
  "content_drafts_delete_editor"
  on storage.objects;
create policy "content_drafts_delete_editor"
on storage.objects for delete
to authenticated
using (
  bucket_id in (
    'content-audio-drafts',
    'content-image-drafts'
  )
  and public.can_edit_drafts()
);

drop policy if exists
  "content_published_select_public"
  on storage.objects;
create policy "content_published_select_public"
on storage.objects for select
to anon, authenticated
using (
  bucket_id in (
    'content-audio',
    'content-images'
  )
);

drop policy if exists
  "content_published_insert_publisher"
  on storage.objects;
create policy "content_published_insert_publisher"
on storage.objects for insert
to authenticated
with check (
  bucket_id in (
    'content-audio',
    'content-images'
  )
  and public.can_publish_content()
);

drop policy if exists
  "content_published_delete_admin"
  on storage.objects;
create policy "content_published_delete_admin"
on storage.objects for delete
to authenticated
using (
  bucket_id in (
    'content-audio',
    'content-images'
  )
  and public.has_admin_role('admin')
);

commit;
