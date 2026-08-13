begin;

drop policy if exists "media_assets_select_published_or_owner" on public.media_assets;
create policy "media_assets_select_published_anon"
on public.media_assets for select to anon
using (status = 'published');
create policy "media_assets_select_owner_or_admin"
on public.media_assets for select to authenticated
using (uploaded_by = auth.uid() or public.is_platform_admin());

commit;
