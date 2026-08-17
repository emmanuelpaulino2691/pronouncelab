begin;

alter table public.media_assets
  add column content_sha256 text,
  add constraint media_assets_content_sha256_format
    check (content_sha256 is null or content_sha256 ~ '^[0-9a-f]{64}$');

create unique index media_assets_owner_kind_content_unique
  on public.media_assets (uploaded_by, kind, content_sha256)
  where uploaded_by is not null
    and content_sha256 is not null
    and status in ('draft', 'published');

create index media_assets_owner_kind_verified_hash_idx
  on public.media_assets (uploaded_by, kind, source_sha256)
  where uploaded_by is not null and source_sha256 is not null;

revoke insert on public.media_assets from authenticated;
drop policy if exists "media_assets_insert_draft" on public.media_assets;

create or replace function public.register_uploaded_media(
  requested_uploaded_by uuid,
  requested_kind public.media_kind,
  requested_bucket text,
  requested_object_path text,
  requested_original_filename text,
  requested_mime_type text,
  requested_size_bytes bigint,
  trusted_content_sha256 text
)
returns table (
  media_asset_id uuid,
  media_status public.content_status,
  canonical_bucket text,
  canonical_object_path text,
  duplicate_upload boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  canonical public.media_assets%rowtype;
  created public.media_assets%rowtype;
begin
  if auth.role() <> 'service_role' then
    raise exception 'Trusted media registration is required';
  end if;
  if requested_uploaded_by is null
    or trusted_content_sha256 !~ '^[0-9a-f]{64}$'
    or requested_size_bytes < 0
    or nullif(pg_catalog.btrim(requested_original_filename), '') is null
    or nullif(pg_catalog.btrim(requested_object_path), '') is null
  then raise exception 'Invalid media registration request'; end if;
  if (requested_kind = 'audio' and requested_bucket <> 'content-audio-drafts')
    or (requested_kind = 'image' and requested_bucket <> 'content-image-drafts')
    or requested_object_path not like requested_uploaded_by::text || '/%'
  then raise exception 'Media upload does not match its owner and draft bucket'; end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(requested_uploaded_by::text),
    pg_catalog.hashtext(requested_kind::text || trusted_content_sha256)
  );

  select asset.* into canonical
  from public.media_assets asset
  where asset.uploaded_by = requested_uploaded_by
    and asset.kind = requested_kind
    and asset.status in ('draft', 'published')
    and coalesce(asset.content_sha256, asset.source_sha256) = trusted_content_sha256
  order by case asset.status when 'published' then 0 else 1 end, asset.created_at, asset.id
  limit 1
  for update;

  if found then
    return query select canonical.id, canonical.status, canonical.bucket,
      canonical.object_path, true;
    return;
  end if;

  insert into public.media_assets (
    kind, bucket, object_path, original_filename, mime_type, size_bytes,
    status, uploaded_by, content_sha256
  ) values (
    requested_kind, requested_bucket, requested_object_path,
    pg_catalog.btrim(requested_original_filename), requested_mime_type,
    requested_size_bytes, 'draft', requested_uploaded_by, trusted_content_sha256
  ) returning * into created;

  return query select created.id, created.status, created.bucket,
    created.object_path, false;
end;
$$;

revoke all on function public.register_uploaded_media(uuid,public.media_kind,text,text,text,text,bigint,text)
  from public, anon, authenticated;
grant execute on function public.register_uploaded_media(uuid,public.media_kind,text,text,text,text,bigint,text)
  to service_role;

drop policy if exists "media_assets_select_published_or_manager" on public.media_assets;
create policy "media_assets_select_published_or_owner"
on public.media_assets for select to anon, authenticated
using (
  status = 'published'
  or uploaded_by = auth.uid()
  or public.is_platform_admin()
);

commit;
