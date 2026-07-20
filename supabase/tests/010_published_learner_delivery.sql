begin;

insert into auth.users (id)
values ('91000000-0000-4000-8000-000000000001');

insert into public.user_roles (user_id, role)
values (
  '91000000-0000-4000-8000-000000000001',
  'admin'
);

select pg_catalog.set_config(
  'request.jwt.claim.sub',
  '91000000-0000-4000-8000-000000000001',
  true
);

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

select public.create_draft_ai_speaking_mission(
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

-- Publish the old version, archive it, then publish the current version.
-- Version 3 remains draft and must never appear.
select public.publish_lesson_version(910004);
update public.lesson_versions
set status = 'archived'
where id = 910004;
select public.publish_lesson_version(910014);

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

do $$
declare
  catalog jsonb;
  lesson jsonb;
  missing jsonb;
  hidden jsonb;
  mission_config jsonb;
begin
  catalog := public.get_published_learning_catalog(1);
  lesson := public.get_published_lesson(910003, 1);
  missing := public.get_published_lesson(919999, 1);
  hidden := public.get_published_lesson(910012, 1);

  if catalog #>> '{courses,0,id}' <> '910001'
    or pg_catalog.jsonb_array_length(catalog -> 'courses') <> 1
  then
    raise exception
      'Catalog publication lifecycle filtering failed';
  end if;

  if lesson #>> '{lesson,currentVersionId}' <> '910014'
    or lesson #>> '{lesson,activities,0,type}' <> 'theory'
    or lesson #>> '{lesson,activities,1,type}' <> 'quiz'
    or lesson #>> '{lesson,activities,2,type}'
      <> 'ai_speaking_mission'
    or lesson::text like '%Stale content.%'
  then
    raise exception
      'Current-version selection or ordering failed';
  end if;

  if lesson::text ~
    '(is_correct|correctAnswer|correct_option|answer_key|explanation)'
    or lesson::text like '%Private answer explanation%'
  then
    raise exception
      'Published lesson projection leaked quiz answer data';
  end if;

  mission_config :=
    lesson #> '{lesson,activities,2,config}';
  if mission_config is null
    or (
      select pg_catalog.count(*)
      from pg_catalog.jsonb_object_keys(
        mission_config
      )
    ) <> 20
    or mission_config ?| array[
      'answer_key',
      'correct_option',
      'created_by',
      'updated_by',
      'editor',
      'publisher',
      'internalNotes'
    ]
  then
    raise exception
      'AI mission learner projection is not allow-listed';
  end if;

  if missing is distinct from hidden
    or hidden -> 'lesson' <> 'null'::jsonb
    or missing is distinct from
      public.get_published_lesson(910013, 1)
    or missing is distinct from
      public.get_published_lesson(910103, 1)
    or missing is distinct from
      public.get_published_lesson(910203, 1)
    or missing is distinct from
      public.get_published_lesson(910304, 1)
    or missing is distinct from
      public.get_published_lesson(910305, 1)
  then
    raise exception
      'Unpublished and nonexistent lesson envelopes differ';
  end if;

  if public.get_published_learning_catalog(2)
      #>> '{error,code}'
      <> 'unsupported_schema_version'
    or public.get_published_lesson(910003, 2)
      #>> '{error,code}'
      <> 'unsupported_schema_version'
  then
    raise exception
      'Schema-version negotiation envelope is invalid';
  end if;

  begin
    insert into public.lesson_versions (
      lesson_id, version_number, status
    )
    values (910003, 2, 'draft');
    raise exception
      'Duplicate lesson version number was accepted';
  exception
    when unique_violation then
      null;
  end;

  begin
    perform public.publish_lesson_version(910015);
    raise exception
      'A second published version was accepted';
  exception
    when unique_violation then
      null;
  end;

  if not pg_catalog.has_function_privilege(
      'anon',
      'public.get_published_learning_catalog(integer)',
      'EXECUTE'
    )
    or not pg_catalog.has_function_privilege(
      'anon',
      'public.get_published_lesson(bigint,integer)',
      'EXECUTE'
    )
    or not pg_catalog.has_function_privilege(
      'authenticated',
      'public.get_published_learning_catalog(integer)',
      'EXECUTE'
    )
    or not pg_catalog.has_function_privilege(
      'authenticated',
      'public.get_published_lesson(bigint,integer)',
      'EXECUTE'
    )
    or not pg_catalog.has_function_privilege(
      'service_role',
      'public.get_published_learning_catalog(integer)',
      'EXECUTE'
    )
    or not pg_catalog.has_function_privilege(
      'service_role',
      'public.get_published_lesson(bigint,integer)',
      'EXECUTE'
    )
  then
    raise exception
      'Public learner RPC grants are incomplete';
  end if;

  if exists (
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
    where procedure.oid in (
      'public.get_published_learning_catalog(integer)'::regprocedure,
      'public.get_published_lesson(bigint,integer)'::regprocedure
    )
      and privilege.grantee = 0
      and privilege.privilege_type = 'EXECUTE'
  )
  then
    raise exception
      'PUBLIC can execute a learner delivery RPC';
  end if;

  if exists (
    select 1
    from (
      values
        (
          'public.learner_public_media_projection(uuid)'
        ),
        (
          'public.learner_safe_questions_projection(bigint)'
        ),
        (
          'public.learner_published_activity_projection(bigint)'
        )
    ) as helper(signature)
    cross join (
      values ('anon'), ('authenticated'), ('service_role')
    ) as api_role(name)
    where pg_catalog.has_function_privilege(
      api_role.name,
      helper.signature,
      'EXECUTE'
    )
  )
  then
    raise exception
      'An API role can execute an internal projection helper';
  end if;

  if pg_catalog.has_table_privilege(
      'anon',
      'public.questions',
      'SELECT'
    )
    or pg_catalog.has_table_privilege(
      'anon',
      'public.question_options',
      'SELECT'
    )
  then
    raise exception
      'Learner roles can read protected quiz base tables';
  end if;
end;
$$;

set local role anon;
select public.get_published_learning_catalog(1);
select public.get_published_lesson(910003, 1);
reset role;

set local role authenticated;
select pg_catalog.set_config(
  'request.jwt.claim.sub',
  '91000000-0000-4000-8000-000000000099',
  true
);
select public.get_published_learning_catalog(1);
select public.get_published_lesson(910003, 1);
do $$
begin
  if exists (select 1 from public.questions)
    or exists (
      select 1 from public.question_options
    )
  then
    raise exception
      'Ordinary authenticated role can read quiz base rows';
  end if;
end;
$$;
reset role;

set local role service_role;
select public.get_published_learning_catalog(1);
select public.get_published_lesson(910003, 1);
reset role;

rollback;
