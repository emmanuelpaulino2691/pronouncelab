begin;

drop policy if exists "media_assets_update_draft" on public.media_assets;
create policy "media_assets_update_owned_draft"
on public.media_assets for update to authenticated
using (
  status = 'draft'
  and (uploaded_by = auth.uid() or public.is_platform_admin())
)
with check (
  status = 'draft'
  and (uploaded_by = auth.uid() or public.is_platform_admin())
);

drop policy if exists "media_assets_delete_draft_editor" on public.media_assets;
create policy "media_assets_delete_owned_draft"
on public.media_assets for delete to authenticated
using (
  status = 'draft'
  and (uploaded_by = auth.uid() or public.is_platform_admin())
);

commit;
