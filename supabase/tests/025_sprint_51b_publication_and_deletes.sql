begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;
select plan(12);

insert into auth.users (id) values
  ('92500000-0000-4000-8000-000000000001'),
  ('92500000-0000-4000-8000-000000000002');
insert into public.user_roles (user_id, role) values
  ('92500000-0000-4000-8000-000000000001', 'teacher'),
  ('92500000-0000-4000-8000-000000000002', 'teacher');

set local request.jwt.claim.sub = '92500000-0000-4000-8000-000000000001';
insert into public.courses (id, slug, title, position, status, owner_user_id)
values (925001, 'sprint-51b', 'Sprint 51B', 925001, 'draft', '92500000-0000-4000-8000-000000000001');
insert into public.units (id, course_id, title, position, status)
values (925011, 925001, 'Published unit', 0, 'draft');
insert into public.lessons (id, unit_id, title, position, status)
values (925021, 925011, 'Published lesson', 0, 'draft');
insert into public.lesson_versions (id, lesson_id, version_number, status, created_by)
values (925031, 925021, 1, 'draft', '92500000-0000-4000-8000-000000000001');
insert into public.media_assets (
  id, kind, bucket, object_path, original_filename, mime_type, size_bytes,
  status, uploaded_by, published_by, published_at
) values (
  '92500000-0000-4000-8000-000000000010', 'audio', 'content-audio',
  '925/transcript.mp3', 'transcript.mp3', 'audio/mpeg', 10, 'published',
  '92500000-0000-4000-8000-000000000001',
  '92500000-0000-4000-8000-000000000001', now()
);
insert into storage.objects (id, bucket_id, name, owner_id, version, metadata)
values (
  '92500000-0000-4000-8000-000000000011', 'content-audio',
  '925/transcript.mp3', '92500000-0000-4000-8000-000000000001',
  '925-version', jsonb_build_object('mimetype', 'audio/mpeg', 'size', 10)
);
insert into public.lesson_activities (id, lesson_version_id, type, title, position)
values (925041, 925031, 'theory', 'Learn with audio', 0);
insert into public.theory_blocks (id, activity_id, block_type, position, title, text, media_asset_id)
values
  (925051, 925041, 'paragraph', 0, null, 'Ready content', null),
  (925052, 925041, 'audio', 1, 'Listen closely', 'Visible Learn transcript', '92500000-0000-4000-8000-000000000010');

set local role authenticated;
select lives_ok($$select public.publish_lesson_version(925031)$$, 'Version 1 publishes');
select is((public.publish_course(925001)->>'ok')::boolean, true, 'course publishes');
do $$ begin perform public.set_course_learner_visibility(925001,'public'); end $$;
select is(
  public.get_published_lesson(925021, 1) #>> '{lesson,activities,0,blocks,1,transcript}',
  'Visible Learn transcript', 'published Learn projection includes the audio transcript');
select is(
  public.get_published_lesson(925021, 1) #>> '{lesson,activities,0,blocks,1,label}',
  'Listen closely', 'published Learn projection includes the audio label');

select public.create_lesson_draft_version(925021, 925011);
create temporary table copied_activity as
select activity.id, activity.lesson_version_id
from public.lesson_activities activity
join public.lesson_versions version on version.id = activity.lesson_version_id
where version.lesson_id = 925021 and version.status = 'draft';
select is(
  public.delete_draft_lesson_activity(
    (select id from copied_activity), (select lesson_version_id from copied_activity)
  ),
  (select id from copied_activity),
  'owner deletes a draft Version 2 activity below published ancestors');
select is((select count(*)::integer from public.lesson_activities where id = (select id from copied_activity)), 0,
  'draft activity is removed');
select is((select count(*)::integer from public.theory_blocks where activity_id = (select id from copied_activity)), 0,
  'activity descendants are removed leaf-first');
select is((select status::text from public.lesson_versions where id = 925031), 'published',
  'published Version 1 remains sealed');

create temporary table owner_activity as
select created.* from public.create_draft_lesson_activity(
  (select id from public.lesson_versions where lesson_id = 925021 and status = 'draft'),
  'theory', 'Owner only'
) created;
set local request.jwt.claim.sub = '92500000-0000-4000-8000-000000000002';
select throws_ok(
  $$select public.delete_draft_lesson_activity((select id from owner_activity), (select lesson_version_id from owner_activity))$$,
  'Course owner or administrator permission is required',
  'another teacher cannot delete the owner draft activity');

set local request.jwt.claim.sub = '92500000-0000-4000-8000-000000000001';
select throws_ok(
  $$select public.delete_draft_lesson_activity(925041, 925031)$$,
  'The requested activity is unavailable in the expected lesson draft',
  'published activity deletion remains forbidden');

-- A sealed historical version is not revalidated during Publish updates.
reset role;
insert into public.courses (id, slug, title, position, status, owner_user_id, published_at)
values (925002, 'historical-51b', 'Historical course', 925002, 'published', '92500000-0000-4000-8000-000000000001', now());
insert into public.units (id, course_id, title, position, status, published_at)
values (925012, 925002, 'Historical unit', 0, 'published', now());
insert into public.lessons (id, unit_id, title, position, status, published_at)
values (925022, 925012, 'Historical lesson', 0, 'published', now());
insert into public.lesson_versions (id, lesson_id, version_number, status, created_by, published_by, published_at)
values (925032, 925022, 1, 'published', '92500000-0000-4000-8000-000000000001', '92500000-0000-4000-8000-000000000001', now());
select pg_catalog.set_config('pronouncelab.lesson_publication', 'on', true);
update public.lessons set current_published_version_id = 925032 where id = 925022;
set local role authenticated;
select is((public.publish_course(925002)->>'ok')::boolean, true,
  'Publish updates ignores sealed historical content with no draft changes');

select public.create_draft_unit(925002, 'Blocking draft unit', '');
select is(
  public.publish_course(925002) #>> '{errors,0,message}',
  'Add at least one lesson before publishing this new draft unit.',
  'validation identifies the new draft addition as the blocker');

select * from finish();
rollback;
