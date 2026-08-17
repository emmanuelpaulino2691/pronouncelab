create view public.media_library_assets
with (security_invoker = true)
as
select ranked.id,
       ranked.kind,
       ranked.bucket,
       ranked.object_path,
       ranked.original_filename,
       ranked.mime_type,
       ranked.size_bytes,
       ranked.status,
       ranked.uploaded_by,
       ranked.created_at,
       ranked.updated_at,
       ranked.published_by,
       ranked.published_at,
       ranked.source_sha256,
       ranked.published_sha256,
       ranked.content_sha256
from (
  select asset.*,
         row_number() over (
           partition by asset.uploaded_by,
                        asset.kind,
                        coalesce(asset.content_sha256, asset.source_sha256, asset.id::text)
           order by case asset.status when 'published' then 0 when 'draft' then 1 else 2 end,
                    asset.created_at,
                    asset.id
         ) as canonical_rank
  from public.media_assets as asset
) as ranked
where ranked.canonical_rank = 1;

revoke all on public.media_library_assets from public;
grant select on public.media_library_assets to authenticated;

comment on view public.media_library_assets is
  'Owner-scoped Media Library presentation. Trusted matching fingerprints collapse to one card without changing stable asset IDs or historical references.';
