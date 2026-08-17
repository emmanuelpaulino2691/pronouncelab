begin;

create extension if not exists pgtap
  with schema extensions;

set local search_path = public, extensions, pg_catalog;

select plan(21);

insert into auth.users (id)
values
  ('92100000-0000-4000-8000-000000000001'),
  ('92100000-0000-4000-8000-000000000002');

insert into public.user_roles (user_id, role)
values
  ('92100000-0000-4000-8000-000000000001', 'teacher'),
  ('92100000-0000-4000-8000-000000000002', 'teacher');

set local request.jwt.claim.sub =
  '92100000-0000-4000-8000-000000000001';

insert into public.courses (
  id, slug, title, description, level, emoji, position, status,
  owner_user_id
)
values (
  921001, 'studio-mutation-course', 'Studio mutation course',
  '', 'A1', '', 921001, 'draft',
  '92100000-0000-4000-8000-000000000001'
);
insert into public.units (id, course_id, title, position, status)
values (921011, 921001, 'Studio unit', 0, 'draft');
insert into public.lessons (id, unit_id, title, position, status)
values
  (921012, 921011, 'Studio lesson', 0, 'draft'),
  (921062, 921011, 'Zero-media lesson', 1, 'draft');
insert into public.lesson_versions (
  id, lesson_id, version_number, status
)
values
  (921013, 921012, 1, 'draft'),
  (921014, 921012, 2, 'draft'),
  (921063, 921062, 1, 'draft');
insert into public.lesson_activities (
  id, lesson_version_id, type, title, position, required
)
values
  (921021, 921013, 'theory', 'Learn', 0, true),
  (921022, 921013, 'quiz', 'Quiz', 1, true),
  (921023, 921013, 'listening', 'Listening', 2, true),
  (921025, 921014, 'theory', 'Sealed Learn', 0, true),
  (921065, 921063, 'theory', 'Zero-media Learn', 0, true);
insert into public.assessment_sets (
  id, activity_id, title, instructions, position
)
values (921031, 921022, 'Quiz settings', null, 0);
insert into public.listening_items (
  id, activity_id, title, instructions, transcript, position
)
values (921041, 921023, 'Listening item', null, null, 0);
insert into public.theory_blocks (
  id, activity_id, block_type, position, text
)
values
  (921051, 921025, 'paragraph', 0, 'Sealed content'),
  (921066, 921065, 'paragraph', 0, 'Ready without media');

update public.lesson_versions
set status = 'archived'
where id = 921014;

select ok(
  (select prosecdef from pg_catalog.pg_proc
   where oid = 'public.lock_content_hierarchy_statement()'::regprocedure),
  'the hierarchy statement trigger owns access to the private gate'
);
select ok(
  (select prosecdef from pg_catalog.pg_proc
   where oid = 'public.protect_versioned_content()'::regprocedure),
  'the row immutability trigger owns access to private hierarchy locks'
);
select ok(
  (select prosecdef from pg_catalog.pg_proc
   where oid = 'public.lock_media_statement()'::regprocedure),
  'the media statement trigger owns access to the private gate'
);
select ok(
  not pg_catalog.has_function_privilege(
    'authenticated',
    'public.lock_content_hierarchy_gate()',
    'EXECUTE'
  ),
  'authenticated callers cannot invoke the internal hierarchy gate directly'
);

set local role authenticated;
set local request.jwt.claim.sub =
  '92100000-0000-4000-8000-000000000001';

select results_eq(
  $test$
    insert into public.theory_blocks (
      activity_id, block_type, position, text
    ) values (921021, 'paragraph', 0, 'Draft paragraph')
    returning activity_id, text
  $test$,
  $test$
    values (921021::bigint, 'Draft paragraph'::text)
  $test$,
  'teacher can create and return a Learn block'
);
select results_eq(
  $test$
    update public.theory_blocks
    set text = 'Saved paragraph'
    where activity_id = 921021
    returning activity_id, text
  $test$,
  $test$
    values (921021::bigint, 'Saved paragraph'::text)
  $test$,
  'teacher can update and return a Learn block'
);
select results_eq(
  $test$
    delete from public.theory_blocks
    where activity_id = 921021
    returning activity_id
  $test$,
  $test$
    values (921021::bigint)
  $test$,
  'teacher can delete and return a Learn block'
);

select results_eq(
  $test$
    update public.assessment_sets
    set title = 'Saved quiz settings'
    where id = 921031
    returning id, title
  $test$,
  $test$
    values (921031::bigint, 'Saved quiz settings'::text)
  $test$,
  'teacher can save and return Quiz settings'
);
select lives_ok(
  $test$
    select public.create_draft_quiz_question(921031, 0)
  $test$,
  'teacher can create a Quiz question'
);
select lives_ok(
  $test$
    select public.save_draft_quiz_question(
      question.id,
      921031,
      question.updated_at,
      'Saved question',
      'Saved explanation',
      true,
      array(
        select option_row.id
        from public.question_options option_row
        where option_row.question_id = question.id
        order by option_row.position
      ),
      array['Correct answer', 'Other answer'],
      0
    )
    from public.questions question
    where question.assessment_set_id = 921031
  $test$,
  'teacher can save Quiz question content and options'
);
select lives_ok(
  $test$
    select public.delete_draft_quiz_question(
      question.id,
      921031
    )
    from public.questions question
    where question.assessment_set_id = 921031
  $test$,
  'teacher can delete a Quiz question through the parent-scoped RPC'
);

select results_eq(
  $test$
    update public.listening_items
    set title = 'Saved listening item', transcript = 'Manual transcript'
    where id = 921041
    returning id, title
  $test$,
  $test$
    values (921041::bigint, 'Saved listening item'::text)
  $test$,
  'teacher can save and return a Listening item'
);

select lives_ok(
  $test$
    select public.create_draft_ai_speaking_mission(
      921013,
      'Configurable AI mission',
      pg_catalog.jsonb_build_object(
        'missionTitle', 'Safe mission',
        'missionLabel', 'Mission',
        'cefrLevel', 'A1',
        'goal', 'Practise a sound.',
        'estimatedMinutes', 5,
        'primarySoundLabel', 'short i',
        'primarySoundIpa', '/i/',
        'secondarySoundLabel', '',
        'secondarySoundIpa', '',
        'primaryWords', pg_catalog.jsonb_build_array('ship'),
        'secondaryWords', '[]'::jsonb,
        'sentences', pg_catalog.jsonb_build_array('The ship is big.'),
        'readingText', 'The ship is big.',
        'supportedTools', pg_catalog.jsonb_build_array('ChatGPT'),
        'promptLanguage', 'English',
        'feedbackLanguage', 'English',
        'difficultyLabel', 'Beginner',
        'resultFormatVersion', 1,
        'teacherInstructions', 'Guide the learner.',
        'studentInstructions', 'Follow these steps.'
      )
    )
  $test$,
  'teacher can create an AI mission activity and configuration'
);
select results_eq(
  $test$
    update public.lesson_activities
    set title = 'Saved AI activity metadata'
    where title = 'Configurable AI mission'
      and lesson_version_id = 921013
    returning title
  $test$,
  $test$
    values ('Saved AI activity metadata'::text)
  $test$,
  'teacher can save and return AI activity metadata'
);
select lives_ok(
  $test$
    select public.save_draft_ai_speaking_mission(
      mission.id,
      mission.activity_id,
      mission.updated_at,
      mission.config || pg_catalog.jsonb_build_object(
        'goal', 'Practise the sound clearly.'
      )
    )
    from public.ai_speaking_missions mission
    where exists (
        select 1 from public.lesson_activities activity
        where activity.id = mission.activity_id
          and activity.lesson_version_id = 921013
          and activity.title = 'Saved AI activity metadata'
      )
  $test$,
  'teacher can save AI mission configuration'
);

select throws_ok(
  $test$
    insert into public.media_assets (
      kind, bucket, object_path, original_filename,
      mime_type, size_bytes, status, uploaded_by
    ) values (
      'audio', 'content-audio-drafts',
      '92100000-0000-4000-8000-000000000001/listening/test.mp3',
      'test.mp3', 'audio/mpeg', 4, 'draft',
      '92100000-0000-4000-8000-000000000001'
    )
    returning status
  $test$,
  'permission denied for table media_assets',
  'teacher media registration must use trusted byte verification'
);

select is(
  (
    select count(*)::integer
    from public.get_lesson_version_media_publication_plan(921013)
  ),
  0,
  'a lesson with no attached media has an empty publication plan'
);
select lives_ok(
  $test$
    select public.publish_lesson_version(921063)
  $test$,
  'a valid zero-media lesson publishes without Storage work'
);

select results_eq(
  $test$
    update public.theory_blocks
    set text = 'Forbidden sealed change'
    where id = 921051
    returning id
  $test$,
  $test$
    select null::bigint where false
  $test$,
  'teacher cannot mutate archived lesson content'
);

set local request.jwt.claim.sub =
  '92100000-0000-4000-8000-000000000002';

select results_eq(
  $test$
    update public.listening_items
    set title = 'Other teacher change'
    where id = 921041
    returning id
  $test$,
  $test$
    select null::bigint where false
  $test$,
  'another teacher cannot update owned Listening content'
);
select results_eq(
  $test$
    delete from public.lesson_activities
    where id = 921021
    returning id
  $test$,
  $test$
    select null::bigint where false
  $test$,
  'another teacher cannot delete an owned activity'
);

reset role;
select * from extensions.finish();

rollback;
