begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;
select plan(25);

select ok(to_regprocedure('public.register_uploaded_media(uuid,public.media_kind,text,text,text,text,bigint,text)') is not null,
  'trusted registration RPC exists');
select ok(not has_function_privilege('authenticated', 'public.register_uploaded_media(uuid,public.media_kind,text,text,text,text,bigint,text)', 'EXECUTE'),
  'browser roles cannot submit trusted hashes');
select ok(has_function_privilege('service_role', 'public.register_uploaded_media(uuid,public.media_kind,text,text,text,text,bigint,text)', 'EXECUTE'),
  'service role can register verified uploads');
select ok(not has_table_privilege('authenticated', 'public.media_assets', 'INSERT'),
  'direct browser media registration is closed');
select ok((select indexdef like '%uploaded_by, kind, content_sha256%'
  from pg_indexes where schemaname = 'public' and indexname = 'media_assets_owner_kind_content_unique'),
  'owner/kind/hash uniqueness is indexed');

insert into auth.users(id) values
  ('92600000-0000-4000-8000-000000000001'),
  ('92600000-0000-4000-8000-000000000002');
insert into public.user_roles(user_id,role) values
  ('92600000-0000-4000-8000-000000000001','teacher'),
  ('92600000-0000-4000-8000-000000000002','teacher');

set local role service_role;
set local request.jwt.claim.role = 'service_role';
create temporary table first_audio as select * from public.register_uploaded_media(
  '92600000-0000-4000-8000-000000000001','audio','content-audio-drafts',
  '92600000-0000-4000-8000-000000000001/one.mp3','A Sound.mp3','audio/mpeg',10,repeat('a',64));
select ok(not (select duplicate_upload from first_audio), 'first audio upload creates a logical asset');
create temporary table duplicate_audio as select * from public.register_uploaded_media(
  '92600000-0000-4000-8000-000000000001','audio','content-audio-drafts',
  '92600000-0000-4000-8000-000000000001/two.mp3','Different name.mp3','audio/mpeg',10,repeat('a',64));
select ok((select duplicate_upload from duplicate_audio), 'same bytes with another filename deduplicate');
select is((select media_asset_id from duplicate_audio),(select media_asset_id from first_audio),
  'duplicate upload returns the stable canonical UUID');
reset role;
select is((select count(*)::integer from public.media_assets where uploaded_by='92600000-0000-4000-8000-000000000001' and kind='audio'),1,
  'duplicate registration creates no redundant Media Library row');
set local role service_role;
set local request.jwt.claim.role = 'service_role';

create temporary table distinct_audio as select * from public.register_uploaded_media(
  '92600000-0000-4000-8000-000000000001','audio','content-audio-drafts',
  '92600000-0000-4000-8000-000000000001/three.mp3','A Sound.mp3','audio/mpeg',10,repeat('b',64));
select isnt((select media_asset_id from distinct_audio),(select media_asset_id from first_audio),
  'same filename with different bytes remains distinct');
create temporary table first_image as select * from public.register_uploaded_media(
  '92600000-0000-4000-8000-000000000001','image','content-image-drafts',
  '92600000-0000-4000-8000-000000000001/one.png','one.png','image/png',10,repeat('c',64));
create temporary table duplicate_image as select * from public.register_uploaded_media(
  '92600000-0000-4000-8000-000000000001','image','content-image-drafts',
  '92600000-0000-4000-8000-000000000001/two.png','two.png','image/png',10,repeat('c',64));
select is((select media_asset_id from duplicate_image),(select media_asset_id from first_image),
  'images deduplicate by verified content');
create temporary table other_owner as select * from public.register_uploaded_media(
  '92600000-0000-4000-8000-000000000002','audio','content-audio-drafts',
  '92600000-0000-4000-8000-000000000002/one.mp3','A Sound.mp3','audio/mpeg',10,repeat('a',64));
select isnt((select media_asset_id from other_owner),(select media_asset_id from first_audio),
  'identical bytes remain isolated by owner');
set local request.jwt.claim.sub='92600000-0000-4000-8000-000000000001';
set local role authenticated;
select is((select count(*)::integer from public.media_assets where uploaded_by='92600000-0000-4000-8000-000000000002'),0,
  'teacher cannot infer another owner media through the library');
select results_eq(
  $$delete from public.media_assets where uploaded_by='92600000-0000-4000-8000-000000000002' returning id$$,
  array[]::uuid[], 'teacher cannot delete another owner draft by guessed UUID');
reset role;

reset role;
insert into public.media_assets(id,kind,bucket,object_path,original_filename,mime_type,size_bytes,status,uploaded_by,published_by,published_at,source_sha256,published_sha256)
values ('92600000-0000-4000-8000-000000000010','audio','content-audio','published.mp3','published.mp3','audio/mpeg',10,'published',
  '92600000-0000-4000-8000-000000000001','92600000-0000-4000-8000-000000000001',now(),repeat('d',64),repeat('d',64));
insert into public.media_assets(id,kind,bucket,object_path,original_filename,mime_type,size_bytes,status,uploaded_by,published_by,published_at,source_sha256,published_sha256)
values ('92600000-0000-4000-8000-000000000011','audio','content-audio','historical-copy.mp3','historical-copy.mp3','audio/mpeg',10,'published',
  '92600000-0000-4000-8000-000000000001','92600000-0000-4000-8000-000000000001',now(),repeat('d',64),repeat('d',64));
set local request.jwt.claim.sub='92600000-0000-4000-8000-000000000001';
set local role authenticated;
select is((select count(*)::integer from public.media_library_assets where source_sha256=repeat('d',64)),1,
  'Media Library presents one canonical card for trusted historical duplicates');
reset role;
set local role service_role;
set local request.jwt.claim.role = 'service_role';
create temporary table published_reuse as select * from public.register_uploaded_media(
  '92600000-0000-4000-8000-000000000001','audio','content-audio-drafts',
  '92600000-0000-4000-8000-000000000001/published-copy.mp3','copy.mp3','audio/mpeg',10,repeat('d',64));
select is((select media_asset_id from published_reuse),'92600000-0000-4000-8000-000000000010'::uuid,
  'verified published media is reused');
select is((select media_status::text from published_reuse),'published','published canonical status is returned');
reset role;
set local request.jwt.claim.sub='92600000-0000-4000-8000-000000000002';
set local role authenticated;
select is((select count(*)::integer from public.media_assets where id='92600000-0000-4000-8000-000000000010'),0,
  'another teacher cannot browse the owner published asset');

reset role;
set local request.jwt.claim.sub='92600000-0000-4000-8000-000000000001';
insert into public.courses(id,slug,title,position,status,owner_user_id) values(926001,'dedup-course','Dedup course',926001,'draft','92600000-0000-4000-8000-000000000001');
insert into public.units(id,course_id,title,position,status) values(926011,926001,'Unit',0,'draft');
insert into public.lessons(id,unit_id,title,position,status) values(926021,926011,'Lesson',0,'draft');
insert into public.lesson_versions(id,lesson_id,version_number,status,created_by) values(926031,926021,1,'draft','92600000-0000-4000-8000-000000000001');
insert into public.lesson_activities(id,lesson_version_id,type,title,position) values(926041,926031,'theory','Learn',0);
insert into public.theory_blocks(id,activity_id,block_type,position,text,media_asset_id) values
  (926051,926041,'audio',0,'First', (select media_asset_id from first_audio)),
  (926052,926041,'audio',1,'Second',(select media_asset_id from first_audio));
select is((select count(*)::integer from public.theory_blocks where media_asset_id=(select media_asset_id from first_audio)),2,
  'two activities or blocks can share one stable asset');
set local request.jwt.claim.sub='92600000-0000-4000-8000-000000000001';
set local role authenticated;
update public.theory_blocks set media_asset_id=null where id=926051;
select is((select count(*)::integer from public.theory_blocks where media_asset_id=(select id from public.media_assets where uploaded_by=auth.uid() and content_sha256=repeat('a',64))),1,
  'removing one reference preserves the other');
select is((select count(*)::integer from public.media_assets where uploaded_by=auth.uid() and content_sha256=repeat('a',64)),1,
  'removing a reference does not delete the shared asset');
select throws_ok(
  $$update public.media_assets set original_filename='changed.mp3' where id='92600000-0000-4000-8000-000000000010'$$,
  'Published or retired media asset metadata is immutable', 'published media remains immutable');

reset role;
select throws_ok(
  $$insert into public.media_assets(kind,bucket,object_path,original_filename,mime_type,size_bytes,status,uploaded_by,content_sha256)
    values('audio','content-audio-drafts','92600000-0000-4000-8000-000000000001/race.mp3','race.mp3','audio/mpeg',10,'draft','92600000-0000-4000-8000-000000000001',repeat('a',64))$$,
  'duplicate key value violates unique constraint "media_assets_owner_kind_content_unique"',
  'authoritative uniqueness rejects a concurrent duplicate logical asset');
select ok(strpos(pg_get_functiondef('public.register_uploaded_media(uuid,public.media_kind,text,text,text,text,bigint,text)'::regprocedure),
  'pg_advisory_xact_lock') > 0, 'registration serializes same-owner hash races');
select is((select count(*)::integer from public.media_assets where uploaded_by='92600000-0000-4000-8000-000000000001' and kind='audio' and coalesce(content_sha256,source_sha256)=repeat('a',64)),1,
  'Media Library has one logical owner-scoped row for matching audio');

select * from finish();
rollback;
