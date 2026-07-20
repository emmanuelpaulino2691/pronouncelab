begin;

create extension if not exists pgtap
  with schema extensions;

set local search_path =
  public, extensions, pg_catalog;

select plan(53);

insert into auth.users (id)
values ('91000000-0000-4000-8000-000000000001');

insert into public.user_roles (user_id, role)
values (
  '91000000-0000-4000-8000-000000000001',
  'admin'
);

set local request.jwt.claim.sub =
  '91000000-0000-4000-8000-000000000001';

-- Build the complete test graph as draft content. Descendants are never
-- inserted into a sealed lesson version.
insert into public.courses (
  id, slug, title, description, level, emoji,
  position, status
)
values
  (
    910001, 'learner-rpc-test', 'Learner RPC Test',
    'Published test course', 'A1', '', 910001, 'draft'
  ),
  (
    910101, 'unpublished-course-test', 'Unpublished course',
    '', 'A1', '', 910101, 'draft'
  ),
  (
    910201, 'archived-course-test', 'Archived course',
    '', 'A1', '', 910201, 'draft'
  ),
  (
    910301, 'hidden-unit-course-test', 'Hidden unit course',
    '', 'A1', '', 910301, 'draft'
  );

insert into public.units (
  id, course_id, title, description, position, status
)
values
  (910002, 910001, 'Published unit', '', 0, 'draft'),
  (910102, 910101, 'Unpublished course unit', '', 0, 'draft'),
  (910202, 910201, 'Archived course unit', '', 0, 'draft'),
  (910302, 910301, 'Unpublished unit', '', 0, 'draft'),
  (910303, 910301, 'Archived unit', '', 1, 'draft');

insert into public.lessons (
  id, unit_id, title, description, position, status
)
values
  (910003, 910002, 'Published lesson', '', 0, 'draft'),
  (910012, 910002, 'Unpublished lesson', '', 1, 'draft'),
  (910013, 910002, 'Archived lesson', '', 2, 'draft'),
  (910103, 910102, 'Hidden by course', '', 0, 'draft'),
  (910203, 910202, 'Hidden by archived course', '', 0, 'draft'),
  (910304, 910302, 'Hidden by unit', '', 0, 'draft'),
  (910305, 910303, 'Hidden by archived unit', '', 0, 'draft');

insert into public.lesson_versions (
  id, lesson_id, version_number, status
)
values
  (910004, 910003, 1, 'draft'),
  (910014, 910003, 2, 'draft'),
  (910015, 910003, 3, 'draft');

insert into public.lesson_activities (
  id, lesson_version_id, type, title, position, required
)
values
  (910016, 910004, 'theory', 'Stale theory', 0, true),
  (910005, 910014, 'theory', 'Theory', 0, true),
  (910006, 910014, 'quiz', 'Quiz', 1, true);

insert into public.theory_blocks (
  id, activity_id, block_type, position, text
)
values
  (910017, 910016, 'paragraph', 0, 'Stale content.'),
  (
    910007, 910005, 'paragraph', 0,
    'Published learner-safe theory.'
  );

insert into public.assessment_sets (
  id, activity_id, title, position
)
values (910008, 910006, 'Safe quiz', 0);

insert into public.questions (
  id, assessment_set_id, prompt, explanation,
  position, required
)
values (
  910009, 910008, 'Choose one.',
  'Private answer explanation.', 0, true
);

insert into public.question_options (
  id, question_id, text, position, is_correct
)
values
  (910010, 910009, 'Wrong', 0, false),
  (910011, 910009, 'Right', 1, true);

do $$
begin
  perform public.create_draft_ai_speaking_mission(
    910014,
    'Allow-listed mission',
    pg_catalog.jsonb_build_object(
    'missionTitle', 'Safe mission',
    'missionLabel', 'Mission',
    'cefrLevel', 'A1',
    'goal', 'Practise a sound.',
    'estimatedMinutes', 5,
    'primarySoundLabel', 'short i',
    'primarySoundIpa', '/ɪ/',
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
    'studentInstructions', 'Speak clearly.',
    'answer_key', 'private',
    'correct_option', 42,
    'created_by', 'private-staff',
    'updated_by', 'private-staff',
    'editor', pg_catalog.jsonb_build_object('id', 'private'),
    'publisher', 'private',
    'internalNotes', pg_catalog.jsonb_build_object(
      'secret', 'private'
    )
    )
  );
end;
$$;

-- Publish the old version, archive it, then publish the current version.
-- Version 3 remains draft and must never appear.
do $$
begin
  perform public.publish_lesson_version(910004);
end;
$$;
update public.lesson_versions
set status = 'archived'
where id = 910004;
do $$
begin
  perform public.publish_lesson_version(910014);
end;
$$;

update public.lessons
set status = 'published',
  current_published_version_id = 910014,
  published_at = pg_catalog.now()
where id = 910003;

update public.units
set status = 'published',
  published_at = pg_catalog.now()
where id = 910002;

update public.courses
set status = 'published',
  published_at = pg_catalog.now()
where id = 910001;

update public.lessons
set status = 'unpublished'
where id in (910012, 910103, 910304);
update public.lessons
set status = 'archived'
where id in (910013, 910203, 910305);
update public.units
set status = 'unpublished'
where id in (910102, 910302);
update public.units
set status = 'archived'
where id in (910202, 910303);
update public.courses
set status = 'unpublished'
where id = 910101;
update public.courses
set status = 'archived'
where id = 910201;
update public.courses
set status = 'published',
  published_at = pg_catalog.now()
where id = 910301;

select is(
  public.get_published_learning_catalog(1)
    #>> '{courses,0,id}',
  '910001',
  'catalog contains the complete published course'
);

select is(
  pg_catalog.jsonb_array_length(
    public.get_published_learning_catalog(1)
      -> 'courses'
  ),
  1,
  'catalog excludes incomplete unpublished and archived hierarchies'
);

select is(
  public.get_published_lesson(910003, 1)
    #>> '{lesson,currentVersionId}',
  '910014',
  'lesson selects the current published version'
);

select is(
  public.get_published_lesson(910003, 1)
    #>> '{lesson,activities,0,type}',
  'theory',
  'first learner activity is ordered theory'
);

select is(
  public.get_published_lesson(910003, 1)
    #>> '{lesson,activities,1,type}',
  'quiz',
  'second learner activity is ordered quiz'
);

select is(
  public.get_published_lesson(910003, 1)
    #>> '{lesson,activities,2,type}',
  'ai_speaking_mission',
  'third learner activity is ordered AI mission'
);

select ok(
  public.get_published_lesson(910003, 1)::text
    not like '%Stale content.%',
  'archived stale-version activity content is absent'
);

select ok(
  public.get_published_lesson(910003, 1)::text
    not like '%910015%',
  'draft future-version identity is absent'
);

select is(
  (
    select status::text
    from public.lesson_versions
    where id = 910004
  ),
  'archived',
  'stale version is archived'
);

select is(
  (
    select status::text
    from public.lesson_versions
    where id = 910014
  ),
  'published',
  'current version is published'
);

select is(
  (
    select status::text
    from public.lesson_versions
    where id = 910015
  ),
  'draft',
  'future version remains draft'
);

select ok(
  public.get_published_lesson(910003, 1)::text
    !~ '(is_correct|correctAnswer|correct_option|answer_key|explanation)'
  and public.get_published_lesson(910003, 1)::text
    not like '%Private answer explanation%',
  'published quiz projection omits answer data'
);

select ok(
  public.get_published_lesson(910003, 1)
    #> '{lesson,activities,2,config}'
    is not null,
  'AI mission learner configuration exists'
);

select is(
  (
    select pg_catalog.count(*)::integer
    from pg_catalog.jsonb_object_keys(
      public.get_published_lesson(910003, 1)
        #> '{lesson,activities,2,config}'
    )
  ),
  20,
  'AI mission projection contains exactly the approved fields'
);

select ok(
  not (
    public.get_published_lesson(910003, 1)
      #> '{lesson,activities,2,config}'
    ?| array[
      'answer_key',
      'correct_option',
      'created_by',
      'updated_by',
      'editor',
      'publisher',
      'internalNotes'
    ]
  ),
  'AI mission projection excludes unknown private fields'
);

select ok(
  (
    public.get_published_lesson(919999, 1)
      - 'generatedAt'
  ) = (
    public.get_published_lesson(910012, 1)
      - 'generatedAt'
  ),
  'nonexistent and unpublished lessons are indistinguishable'
);

select is(
  public.get_published_lesson(910012, 1)
    -> 'lesson',
  'null'::jsonb,
  'unpublished lesson is hidden'
);

select ok(
  (
    public.get_published_lesson(919999, 1)
      - 'generatedAt'
  ) = (
    public.get_published_lesson(910013, 1)
      - 'generatedAt'
  ),
  'archived lesson is hidden'
);

select ok(
  (
    public.get_published_lesson(919999, 1)
      - 'generatedAt'
  ) = (
    public.get_published_lesson(910103, 1)
      - 'generatedAt'
  ),
  'unpublished course hides its lesson'
);

select ok(
  (
    public.get_published_lesson(919999, 1)
      - 'generatedAt'
  ) = (
    public.get_published_lesson(910203, 1)
      - 'generatedAt'
  ),
  'archived course hides its lesson'
);

select ok(
  (
    public.get_published_lesson(919999, 1)
      - 'generatedAt'
  ) = (
    public.get_published_lesson(910304, 1)
      - 'generatedAt'
  ),
  'unpublished unit hides its lesson'
);

select ok(
  (
    public.get_published_lesson(919999, 1)
      - 'generatedAt'
  ) = (
    public.get_published_lesson(910305, 1)
      - 'generatedAt'
  ),
  'archived unit hides its lesson'
);

select is(
  public.get_published_learning_catalog(2)
    #>> '{error,code}',
  'unsupported_schema_version',
  'catalog returns the stable unsupported-version error'
);

select is(
  public.get_published_lesson(910003, 2)
    #>> '{error,code}',
  'unsupported_schema_version',
  'lesson returns the stable unsupported-version error'
);

select throws_ok(
  $test$
    insert into public.lesson_versions (
      lesson_id, version_number, status
    )
    values (910003, 2, 'draft')
  $test$,
  '23505',
  'duplicate lesson version numbers are rejected'
);

select throws_ok(
  $test$
    select public.publish_lesson_version(910015)
  $test$,
  '23505',
  'a second published version is rejected'
);

select ok(
  pg_catalog.has_function_privilege(
    'anon',
    'public.get_published_learning_catalog(integer)',
    'EXECUTE'
  ),
  'anon can execute catalog RPC'
);

select ok(
  pg_catalog.has_function_privilege(
    'anon',
    'public.get_published_lesson(bigint,integer)',
    'EXECUTE'
  ),
  'anon can execute lesson RPC'
);

select ok(
  pg_catalog.has_function_privilege(
    'authenticated',
    'public.get_published_learning_catalog(integer)',
    'EXECUTE'
  ),
  'authenticated can execute catalog RPC'
);

select ok(
  pg_catalog.has_function_privilege(
    'authenticated',
    'public.get_published_lesson(bigint,integer)',
    'EXECUTE'
  ),
  'authenticated can execute lesson RPC'
);

select ok(
  pg_catalog.has_function_privilege(
    'service_role',
    'public.get_published_learning_catalog(integer)',
    'EXECUTE'
  ),
  'service_role can execute catalog RPC'
);

select ok(
  pg_catalog.has_function_privilege(
    'service_role',
    'public.get_published_lesson(bigint,integer)',
    'EXECUTE'
  ),
  'service_role can execute lesson RPC'
);

select ok(
  not exists (
    select 1
    from pg_catalog.pg_proc as procedure
    cross join lateral pg_catalog.aclexplode(
      coalesce(
        procedure.proacl,
        pg_catalog.acldefault(
          'f',
          procedure.proowner
        )
      )
    ) as privilege
    where procedure.oid =
      'public.get_published_learning_catalog(integer)'::regprocedure
      and privilege.grantee = 0
      and privilege.privilege_type = 'EXECUTE'
  ),
  'PUBLIC cannot execute catalog RPC'
);

select ok(
  not exists (
    select 1
    from pg_catalog.pg_proc as procedure
    cross join lateral pg_catalog.aclexplode(
      coalesce(
        procedure.proacl,
        pg_catalog.acldefault(
          'f',
          procedure.proowner
        )
      )
    ) as privilege
    where procedure.oid =
      'public.get_published_lesson(bigint,integer)'::regprocedure
      and privilege.grantee = 0
      and privilege.privilege_type = 'EXECUTE'
  ),
  'PUBLIC cannot execute lesson RPC'
);

select ok(
  not pg_catalog.has_function_privilege(
    'anon',
    'public.learner_public_media_projection(uuid)',
    'EXECUTE'
  ),
  'anon cannot execute media helper'
);

select ok(
  not pg_catalog.has_function_privilege(
    'authenticated',
    'public.learner_public_media_projection(uuid)',
    'EXECUTE'
  ),
  'authenticated cannot execute media helper'
);

select ok(
  not pg_catalog.has_function_privilege(
    'service_role',
    'public.learner_public_media_projection(uuid)',
    'EXECUTE'
  ),
  'service_role cannot execute media helper'
);

select ok(
  not pg_catalog.has_function_privilege(
    'anon',
    'public.learner_safe_questions_projection(bigint)',
    'EXECUTE'
  ),
  'anon cannot execute question helper'
);

select ok(
  not pg_catalog.has_function_privilege(
    'authenticated',
    'public.learner_safe_questions_projection(bigint)',
    'EXECUTE'
  ),
  'authenticated cannot execute question helper'
);

select ok(
  not pg_catalog.has_function_privilege(
    'service_role',
    'public.learner_safe_questions_projection(bigint)',
    'EXECUTE'
  ),
  'service_role cannot execute question helper'
);

select ok(
  not pg_catalog.has_function_privilege(
    'anon',
    'public.learner_published_activity_projection(bigint)',
    'EXECUTE'
  ),
  'anon cannot execute activity helper'
);

select ok(
  not pg_catalog.has_function_privilege(
    'authenticated',
    'public.learner_published_activity_projection(bigint)',
    'EXECUTE'
  ),
  'authenticated cannot execute activity helper'
);

select ok(
  not pg_catalog.has_function_privilege(
    'service_role',
    'public.learner_published_activity_projection(bigint)',
    'EXECUTE'
  ),
  'service_role cannot execute activity helper'
);

select ok(
  not pg_catalog.has_table_privilege(
    'anon',
    'public.questions',
    'SELECT'
  ),
  'anon has no direct question table privilege'
);

select ok(
  not pg_catalog.has_table_privilege(
    'anon',
    'public.question_options',
    'SELECT'
  ),
  'anon has no direct option table privilege'
);

set local role anon;

select lives_ok(
  $test$
    select public.get_published_learning_catalog(1)
  $test$,
  'anon can call catalog RPC'
);

select lives_ok(
  $test$
    select public.get_published_lesson(910003, 1)
  $test$,
  'anon can call lesson RPC'
);

reset role;

set local role authenticated;

set local request.jwt.claim.sub =
  '91000000-0000-4000-8000-000000000099';

select lives_ok(
  $test$
    select public.get_published_learning_catalog(1)
  $test$,
  'ordinary authenticated user can call catalog RPC'
);

select lives_ok(
  $test$
    select public.get_published_lesson(910003, 1)
  $test$,
  'ordinary authenticated user can call lesson RPC'
);

select results_eq(
  $test$
    select id from public.questions
  $test$,
  $test$
    select null::bigint where false
  $test$,
  'ordinary authenticated user sees no question rows through RLS'
);

select results_eq(
  $test$
    select id from public.question_options
  $test$,
  $test$
    select null::bigint where false
  $test$,
  'ordinary authenticated user sees no option rows through RLS'
);

reset role;

set local role service_role;

select lives_ok(
  $test$
    select public.get_published_learning_catalog(1)
  $test$,
  'service_role can call catalog RPC'
);

select lives_ok(
  $test$
    select public.get_published_lesson(910003, 1)
  $test$,
  'service_role can call lesson RPC'
);

reset role;

select * from finish();

rollback;
