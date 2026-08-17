begin;

select extensions.plan(12);

select ok(to_regprocedure('public.get_lesson_version_media_publication_plan(bigint)') is not null,
  'lesson publication exposes an authorized stable-media plan');
select ok(to_regprocedure('public.get_course_media_publication_plan(bigint)') is not null,
  'course publication exposes an authorized stable-media plan');
select ok(to_regprocedure('public.prepare_media_publication(uuid)') is not null,
  'draft media follows the prepare lifecycle');
select ok(to_regprocedure('public.finalize_media_publication(uuid,uuid,text,text)') is not null,
  'trusted byte verification remains the finalization boundary');
select ok(not pg_catalog.has_function_privilege('anon', 'public.get_lesson_version_media_publication_plan(bigint)', 'EXECUTE'),
  'anonymous callers cannot inspect a draft lesson media plan');
select ok(not pg_catalog.has_function_privilege('anon', 'public.get_course_media_publication_plan(bigint)', 'EXECUTE'),
  'anonymous callers cannot inspect a draft course media plan');
select ok(pg_catalog.has_function_privilege('authenticated', 'public.get_lesson_version_media_publication_plan(bigint)', 'EXECUTE'),
  'authenticated publishers can request a lesson media plan');
select ok(not pg_catalog.has_function_privilege('authenticated', 'public.finalize_media_publication(uuid,uuid,text,text)', 'EXECUTE'),
  'browser clients cannot finalize media');
select ok(pg_catalog.has_function_privilege('service_role', 'public.finalize_media_publication(uuid,uuid,text,text)', 'EXECUTE'),
  'only the trusted service can finalize verified bytes');
select function_returns('public', 'create_lesson_draft_version', array['bigint','bigint'], 'lesson_versions',
  'published lessons retain the controlled draft-copy RPC');
select ok(
  pg_catalog.pg_get_functiondef('public.create_lesson_draft_version(bigint,bigint)'::regprocedure)
    like '%public.can_edit_course(target_course_id)%',
  'draft copying uses course-scoped ownership');
select ok(
  pg_catalog.strpos(
    pg_catalog.pg_get_functiondef(
      'public.create_lesson_draft_version(bigint,bigint)'::regprocedure
    ),
    'from public.assessment_sets'
  ) > 0
  and pg_catalog.strpos(
    pg_catalog.pg_get_functiondef(
      'public.create_lesson_draft_version(bigint,bigint)'::regprocedure
    ),
    'source_item.id = source_set.listening_item_id'
  ) > 0,
  'draft copying includes assessment descendants for every activity type');

select * from extensions.finish();
rollback;
