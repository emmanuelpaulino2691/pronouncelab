begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;
select plan(30);

insert into auth.users (id) values
  ('92200000-0000-4000-8000-000000000001'),
  ('92200000-0000-4000-8000-000000000002'),
  ('92200000-0000-4000-8000-000000000003');
insert into public.user_roles (user_id, role) values
  ('92200000-0000-4000-8000-000000000001', 'teacher'),
  ('92200000-0000-4000-8000-000000000002', 'teacher'),
  ('92200000-0000-4000-8000-000000000003', 'admin');

set local request.jwt.claim.sub = '92200000-0000-4000-8000-000000000001';

insert into public.courses (
  id, slug, title, position, status, owner_user_id
) values
  (922001, 'published-copy-regression', 'Published copy regression', 922001,
   'draft', '92200000-0000-4000-8000-000000000001'),
  (922002, 'incomplete-regression', 'Incomplete regression', 922002,
   'draft', '92200000-0000-4000-8000-000000000001'),
  (922003, 'eligible-regression', 'Eligible regression', 922003,
   'draft', '92200000-0000-4000-8000-000000000001');
insert into public.units (id, course_id, title, position, status) values
  (922011, 922001, 'Published unit', 0, 'draft'),
  (922012, 922002, 'Empty unit', 0, 'draft'),
  (922013, 922003, 'Eligible unit', 0, 'draft');
insert into public.lessons (id, unit_id, title, position, status)
values
  (922021, 922011, 'Published lesson', 0, 'draft'),
  (922022, 922013, 'Eligible lesson', 0, 'draft');
insert into public.lesson_versions (
  id, lesson_id, version_number, status, created_by
) values (
  922031, 922021, 1, 'draft',
  '92200000-0000-4000-8000-000000000001'
), (
  922032, 922022, 1, 'draft',
  '92200000-0000-4000-8000-000000000001'
);

insert into public.media_assets (
  id, kind, bucket, object_path, original_filename, mime_type,
  size_bytes, status, uploaded_by, published_by, published_at
) values
  ('92200000-0000-4000-8000-000000000101', 'image', 'content-images',
   'tests/922/image.png', 'image.png', 'image/png', 10, 'published',
   '92200000-0000-4000-8000-000000000001',
   '92200000-0000-4000-8000-000000000001', now()),
  ('92200000-0000-4000-8000-000000000102', 'audio', 'content-audio',
   'tests/922/audio.mp3', 'audio.mp3', 'audio/mpeg', 10, 'published',
   '92200000-0000-4000-8000-000000000001',
   '92200000-0000-4000-8000-000000000001', now());

select pg_catalog.set_config('pronouncelab.ai_mission_creation', 'on', true);
insert into public.lesson_activities (
  id, lesson_version_id, type, title, position, required
) values
  (922041, 922031, 'theory', 'Learn', 0, true),
  (922042, 922031, 'listening', 'Listening', 1, true),
  (922043, 922031, 'pronunciation', 'Pronunciation', 2, true),
  (922044, 922031, 'quiz', 'Quiz', 3, true),
  (922045, 922031, 'ai_speaking_mission', 'AI mission', 4, true),
  (922047, 922032, 'theory', 'Ready Learn', 0, true);
select pg_catalog.set_config('pronouncelab.ai_mission_creation', 'off', true);

insert into public.theory_blocks (
  id, activity_id, block_type, position, text, media_asset_id
) values
  (922051, 922041, 'paragraph', 0, 'Published text', null),
  (922052, 922041, 'image', 1, null,
   '92200000-0000-4000-8000-000000000101'),
  (922053, 922041, 'audio', 2, null,
   '92200000-0000-4000-8000-000000000102'),
  (922054, 922047, 'paragraph', 0, 'Ready content', null);
insert into public.listening_items (
  id, activity_id, title, audio_asset_id, position
) values (
  922061, 922042, 'Listen',
  '92200000-0000-4000-8000-000000000102', 0
);
insert into public.pronunciation_items (
  id, activity_id, title, display_text, position
) values (922071, 922043, 'Word', 'word', 0);
insert into public.assessment_sets (
  id, activity_id, listening_item_id, title, position
) values
  (922081, 922044, null, 'Quiz set', 0),
  (922082, 922042, 922061, 'Listening set', 0);
insert into public.questions (
  id, assessment_set_id, prompt, position, required
) values
  (922091, 922081, 'Quiz question?', 0, true),
  (922092, 922082, 'Listening question?', 0, true);
insert into public.question_options (
  id, question_id, text, position, is_correct
) values
  (922101, 922091, 'Yes', 0, true),
  (922102, 922091, 'No', 1, false),
  (922103, 922092, 'Yes', 0, true),
  (922104, 922092, 'No', 1, false);
insert into public.ai_speaking_missions (id, activity_id, config)
values (
  922111, 922045,
  jsonb_build_object(
    'missionTitle', 'Safe mission', 'missionLabel', 'Mission',
    'cefrLevel', 'A1', 'goal', 'Practise a sound.',
    'estimatedMinutes', 5, 'primarySoundLabel', 'short i',
    'primarySoundIpa', '/i/', 'secondarySoundLabel', '',
    'secondarySoundIpa', '', 'primaryWords', jsonb_build_array('ship'),
    'secondaryWords', '[]'::jsonb,
    'sentences', jsonb_build_array('The ship is big.'),
    'readingText', 'The ship is big.',
    'supportedTools', jsonb_build_array('ChatGPT'),
    'promptLanguage', 'English', 'feedbackLanguage', 'English',
    'difficultyLabel', 'Beginner', 'resultFormatVersion', 1,
    'teacherInstructions', 'Guide the learner.',
    'studentInstructions', 'Follow these steps.'
  )
);
select pg_catalog.set_config('pronouncelab.lesson_publication', 'on', true);
update public.lesson_versions set status = 'published',
  published_by = '92200000-0000-4000-8000-000000000001',
  published_at = now() where id = 922031;
update public.lessons set status = 'published', published_at = now(),
  current_published_version_id = 922031 where id = 922021;
update public.units set status = 'published', published_at = now()
where id = 922011;
update public.courses set status = 'published', published_at = now()
where id = 922001;
select pg_catalog.set_config('pronouncelab.lesson_publication', 'off', true);

set local role authenticated;

select results_eq(
  $$update public.theory_blocks set media_asset_id = null where id = 922052 returning id$$,
  array[]::bigint[],
  'owner teacher cannot remove a published Learn image reference');
select results_eq(
  $$update public.theory_blocks set media_asset_id = null where id = 922053 returning id$$,
  array[]::bigint[],
  'owner teacher cannot remove a published Learn audio reference');
select is((select media_asset_id from public.theory_blocks where id = 922052),
  '92200000-0000-4000-8000-000000000101'::uuid,
  'published image reference remains unchanged');
select is((select media_asset_id from public.theory_blocks where id = 922053),
  '92200000-0000-4000-8000-000000000102'::uuid,
  'published audio reference remains unchanged');

set local request.jwt.claim.sub = '92200000-0000-4000-8000-000000000003';
select results_eq(
  $$update public.theory_blocks set media_asset_id = null where id = 922052 returning id$$,
  array[]::bigint[],
  'administrator cannot mutate published Learn image content');
select results_eq(
  $$update public.theory_blocks set media_asset_id = null where id = 922053 returning id$$,
  array[]::bigint[],
  'administrator cannot mutate published Learn audio content');

set local request.jwt.claim.sub = '92200000-0000-4000-8000-000000000001';
select is((public.publish_course(922003)->>'ok')::boolean, true,
  'eligible teacher-owned course publication succeeds');
select is((select status::text from public.courses where id = 922003),
  'published', 'eligible course remains published');
select is((public.publish_course(922002)->>'ok')::boolean, false,
  'genuinely incomplete course publication is rejected');
select is((select status::text from public.courses where id = 922002),
  'draft', 'rejected incomplete course remains draft');
do $$ begin perform public.set_course_learner_visibility(922001,'public'); end $$;

select ok(
  public.get_published_learning_catalog(1)->'courses' @>
    '[{"id":"922001"}]'::jsonb,
  'learner catalog exposes the eligible published hierarchy');
select ok(
  not (public.get_published_learning_catalog(1)->'courses' @>
    '[{"id":"922002"}]'::jsonb),
  'learner catalog excludes an unpublished parent hierarchy');

create temporary table copied_version as
select (public.create_lesson_draft_version(922021, 922011)).*;

select isnt((select id from copied_version), 922031::bigint,
  'draft copy receives a distinct version ID');
select is((select version_number from copied_version), 2,
  'draft copy is Version 2');
select is((select status::text from public.lesson_versions where id = 922031),
  'published', 'Version 1 remains published');
select is((select current_published_version_id from public.lessons where id = 922021),
  922031::bigint, 'current published pointer remains Version 1');
select is((select count(*)::integer from public.lesson_activities
  where lesson_version_id = (select id from copied_version)), 5,
  'all lesson activities copy');
select is((select count(*)::integer from public.theory_blocks block
  join public.lesson_activities activity on activity.id = block.activity_id
  where activity.lesson_version_id = (select id from copied_version)), 3,
  'all Learn blocks copy');
select is((select media_asset_id from public.theory_blocks block
  join public.lesson_activities activity on activity.id = block.activity_id
  where activity.lesson_version_id = (select id from copied_version)
    and block.block_type = 'image'),
  '92200000-0000-4000-8000-000000000101'::uuid,
  'draft copy retains the stable image UUID');
select is((select media_asset_id from public.theory_blocks block
  join public.lesson_activities activity on activity.id = block.activity_id
  where activity.lesson_version_id = (select id from copied_version)
    and block.block_type = 'audio'),
  '92200000-0000-4000-8000-000000000102'::uuid,
  'draft copy retains the stable audio UUID');
select is((select count(*)::integer from public.listening_items item
  join public.lesson_activities activity on activity.id = item.activity_id
  where activity.lesson_version_id = (select id from copied_version)), 1,
  'Listening descendants copy');
select is((select count(*)::integer from public.pronunciation_items item
  join public.lesson_activities activity on activity.id = item.activity_id
  where activity.lesson_version_id = (select id from copied_version)), 1,
  'Pronunciation descendants copy');
select is((select count(*)::integer from public.assessment_sets assessment
  join public.lesson_activities activity on activity.id = assessment.activity_id
  where activity.lesson_version_id = (select id from copied_version)), 2,
  'Quiz and Listening assessment sets copy');
select is((select count(*)::integer from public.question_options option_row
  join public.questions question on question.id = option_row.question_id
  join public.assessment_sets assessment on assessment.id = question.assessment_set_id
  join public.lesson_activities activity on activity.id = assessment.activity_id
  where activity.lesson_version_id = (select id from copied_version)), 4,
  'assessment questions and options copy');
select is((select count(*)::integer from public.ai_speaking_missions mission
  join public.lesson_activities activity on activity.id = mission.activity_id
  where activity.lesson_version_id = (select id from copied_version)), 1,
  'AI mission configuration copies beneath published parents');
set local request.jwt.claim.sub = '92200000-0000-4000-8000-000000000002';
select throws_ok(
  $$select public.create_lesson_draft_version(922021, 922011)$$,
  'Course owner or administrator permission is required',
  'another teacher cannot create or obtain the owner draft');
select results_eq(
  $$update public.theory_blocks block set text = 'foreign edit'
    from public.lesson_activities activity
    where activity.id = block.activity_id
      and activity.lesson_version_id = (select id from copied_version)
    returning block.id$$,
  array[]::bigint[],
  'another teacher cannot edit the owner draft');

set local request.jwt.claim.sub = '92200000-0000-4000-8000-000000000001';
select results_eq(
  $$with changed as (
      update public.theory_blocks block set media_asset_id = null
      from public.lesson_activities activity
      where activity.id = block.activity_id
        and activity.lesson_version_id = (select id from copied_version)
        and block.block_type = 'image'
      returning block.id
    ) select count(*)::integer from changed$$,
  array[1]::integer[],
  'draft Learn image reference remains removable');
select results_eq(
  $$with changed as (
      update public.theory_blocks block set media_asset_id = null
      from public.lesson_activities activity
      where activity.id = block.activity_id
        and activity.lesson_version_id = (select id from copied_version)
        and block.block_type = 'audio'
      returning block.id
    ) select count(*)::integer from changed$$,
  array[1]::integer[],
  'draft Learn audio reference remains removable');
select is((select count(*)::integer from public.theory_blocks
  where id in (922052, 922053) and media_asset_id is not null), 2,
  'draft edits leave both published references unchanged');

select * from finish();
rollback;
