begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;
select plan(22);

insert into auth.users (id) values
  ('92300000-0000-4000-8000-000000000001'),
  ('92300000-0000-4000-8000-000000000002');
insert into public.user_roles (user_id, role) values
  ('92300000-0000-4000-8000-000000000001', 'teacher'),
  ('92300000-0000-4000-8000-000000000002', 'teacher');

set local request.jwt.claim.sub = '92300000-0000-4000-8000-000000000001';

insert into public.courses (
  id, slug, title, position, status, owner_user_id
) values (
  923001, 'version-republication', 'Version republication', 923001,
  'draft', '92300000-0000-4000-8000-000000000001'
);
insert into public.units (id, course_id, title, position, status)
values (923011, 923001, 'Unit', 0, 'draft');
insert into public.lessons (id, unit_id, title, position, status)
values (923021, 923011, 'Lesson', 0, 'draft');
insert into public.lesson_versions (
  id, lesson_id, version_number, status, created_by
) values (
  923031, 923021, 1, 'draft',
  '92300000-0000-4000-8000-000000000001'
);
insert into public.media_assets (
  id, kind, bucket, object_path, original_filename, mime_type,
  size_bytes, status, uploaded_by, published_by, published_at
) values (
  '92300000-0000-4000-8000-000000000101', 'image',
  'content-images', 'tests/923/stable.png', 'stable.png', 'image/png',
  10, 'published', '92300000-0000-4000-8000-000000000001',
  '92300000-0000-4000-8000-000000000001', now()
);
insert into storage.objects (
  id, bucket_id, name, owner_id, version, metadata
) values (
  '92300000-0000-4000-8000-000000000201', 'content-images',
  'tests/923/stable.png', '92300000-0000-4000-8000-000000000001',
  '923-version', jsonb_build_object('mimetype', 'image/png', 'size', 10)
);
insert into public.lesson_activities (
  id, lesson_version_id, type, title, position, required
) values (923041, 923031, 'theory', 'Learn', 0, true);
insert into public.theory_blocks (
  id, activity_id, block_type, position, text, media_asset_id
) values (
  923051, 923041, 'image', 0, 'Version 1 image',
  '92300000-0000-4000-8000-000000000101'
);

set local role authenticated;

select lives_ok(
  $$select public.publish_lesson_version(923031)$$,
  'media-bearing Version 1 publishes'
);
select is((select current_published_version_id from public.lessons where id = 923021),
  923031::bigint, 'Version 1 becomes current');

create temporary table version_two as
select (public.create_lesson_draft_version(923021, 923011)).*;

select isnt((select id from version_two), 923031::bigint,
  'Version 2 receives a distinct ID');
select is((select version_number from version_two), 2,
  'draft copy is Version 2');
select is((select media_asset_id from public.theory_blocks block
  join public.lesson_activities activity on activity.id = block.activity_id
  where activity.lesson_version_id = (select id from version_two)),
  '92300000-0000-4000-8000-000000000101'::uuid,
  'Version 2 reuses the stable published media UUID');
select is((select count(*)::integer
  from public.get_lesson_version_media_publication_plan(
    (select id from version_two)
  ) where media_status = 'published'), 1,
  'media plan classifies reused media as already published');

select results_eq(
  $$update public.theory_blocks block set text = 'Version 2 learner text'
    from public.lesson_activities activity
    where activity.id = block.activity_id
      and activity.lesson_version_id = (select id from version_two)
    returning block.id$$,
  array[(select min(block.id) from public.theory_blocks block
    join public.lesson_activities activity on activity.id = block.activity_id
    where activity.lesson_version_id = (select id from version_two))]::bigint[],
  'Version 2 remains editable'
);
update public.lesson_activities
set title = 'Version 2 learner title'
where lesson_version_id = (select id from version_two);

set local request.jwt.claim.sub = '92300000-0000-4000-8000-000000000002';
select throws_ok(
  format('select public.publish_lesson_version(%s)', (select id from version_two)),
  'Course publication permission is required',
  'another teacher cannot publish the owner draft'
);
select is((select status::text from version_two), 'draft',
  'foreign publication attempt leaves Version 2 draft');

set local request.jwt.claim.sub = '92300000-0000-4000-8000-000000000001';
create temporary table first_lesson_timestamp as
select published_at from public.lessons where id = 923021;
select lives_ok(
  format('select public.publish_lesson_version(%s)', (select id from version_two)),
  'Version 2 republishes over an already-published lesson'
);
select is((select current_published_version_id from public.lessons where id = 923021),
  (select id from version_two), 'current pointer advances from Version 1 to Version 2');
select is((select status::text from public.lesson_versions where id = 923031),
  'archived', 'Version 1 remains sealed as historical content');
select is((select status::text from public.lesson_versions
  where id = (select id from version_two)), 'published',
  'Version 2 becomes published');
select is((select published_at from public.lessons where id = 923021),
  (select published_at from first_lesson_timestamp),
  'lesson keeps its original publication timestamp during version activation');
select ok(public.get_published_lesson(923021, 1)::text like '%Version 2 learner title%',
  'learner delivery resolves Version 2 content');
select is((select count(*)::integer from public.media_assets
  where id = '92300000-0000-4000-8000-000000000101'), 1,
  'republishing creates no duplicate stable media asset');

create temporary table incomplete_version as
select (public.create_lesson_draft_version(923021, 923011)).*;
create temporary table incomplete_activity as
select (public.create_draft_lesson_activity(
  (select id from incomplete_version), 'listening', 'Incomplete'
)).*;
select throws_ok(
  format('select public.publish_lesson_version(%s)', (select id from incomplete_version)),
  format('Invalid publication content: listening item %s requires audio',
    (select item.id from public.listening_items item
      where item.activity_id = (select id from incomplete_activity))),
  'genuinely incomplete copied content is rejected'
);
select is((select status::text from public.lesson_versions
  where id = (select id from incomplete_version)), 'draft',
  'failed publication leaves the new version draft');
select is((select current_published_version_id from public.lessons where id = 923021),
  (select id from version_two), 'failed publication leaves Version 2 current');
select is((select status::text from public.lesson_versions
  where id = (select id from version_two)), 'published',
  'failed publication leaves current published content unchanged');
select is((select count(*)::integer from public.media_assets
  where id = '92300000-0000-4000-8000-000000000101'), 1,
  'failed publication creates no media asset');
select is((select count(*)::integer from storage.objects
  where name = 'tests/923/stable.png'), 1,
  'failed publication creates no orphan Storage object');

select * from finish();
rollback;
