begin;

create extension if not exists pgtap
  with schema extensions;

set local search_path = public, extensions, pg_catalog;
select plan(2);

insert into public.courses (
  id, slug, title, description, level, emoji, position, status
) values (
  912001, 'listening-publication-test', 'Listening test', '', 'A1', '', 912001, 'draft'
);
insert into public.units (
  id, course_id, title, description, position, status
) values (912002, 912001, 'Unit', '', 0, 'draft');
insert into public.lessons (
  id, unit_id, title, description, position, status
) values (912003, 912002, 'Lesson', '', 0, 'draft');
insert into public.lesson_versions (
  id, lesson_id, version_number, status
) values (912004, 912003, 1, 'draft');
insert into public.lesson_activities (
  id, lesson_version_id, type, title, position, required
) values (912005, 912004, 'listening', 'Listening', 0, true);
insert into public.listening_items (
  id, activity_id, title, transcript, position
) values (912006, 912005, 'Listen', null, 0);

select throws_ok(
  $test$select public.validate_lesson_version_listening_audio(912004)$test$,
  'Invalid publication content: listening item 912006 requires audio',
  'publication rejects a listening item without audio'
);

insert into public.media_assets (
  id, kind, bucket, object_path, original_filename,
  mime_type, size_bytes, status
) values (
  '91200000-0000-4000-8000-000000000001',
  'audio', 'content-audio-drafts',
  'tests/listening.mp3', 'listening.mp3',
  'audio/mpeg', 100, 'draft'
);
update public.listening_items
set audio_asset_id = '91200000-0000-4000-8000-000000000001'
where id = 912006;

select lives_ok(
  $test$select public.validate_lesson_version_listening_audio(912004)$test$,
  'publication listening validation accepts an attached managed audio asset'
);

select * from finish();
rollback;
