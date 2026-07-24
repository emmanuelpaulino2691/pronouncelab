begin;

create or replace function public.can_edit_lesson_version(
  requested_lesson_version_id bigint
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.lesson_versions version
    join public.lessons lesson on lesson.id = version.lesson_id
    join public.units unit on unit.id = lesson.unit_id
    join public.courses course on course.id = unit.course_id
    where version.id = requested_lesson_version_id
      and version.status = 'draft'
      and public.can_edit_course(course.id)
  );
$$;

revoke all on function public.can_edit_lesson_version(bigint)
  from public, anon;
grant execute on function public.can_edit_lesson_version(bigint)
  to authenticated;

create or replace function public.is_draft_activity(
  requested_activity_id bigint
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.lesson_activities activity
    where activity.id = requested_activity_id
      and public.can_edit_lesson_version(activity.lesson_version_id)
  );
$$;

revoke all on function public.is_draft_activity(bigint)
  from public, anon;
grant execute on function public.is_draft_activity(bigint)
  to authenticated;

do $$
declare
  function_row record;
  function_definition text;
  mutation_functions constant text[] := array[
    'create_draft_lesson_activity',
    'reorder_draft_lesson_activities',
    'reorder_draft_theory_blocks',
    'create_draft_quiz_question',
    'save_draft_quiz_question',
    'reorder_draft_quiz_questions',
    'duplicate_draft_lesson_activity',
    'create_draft_ai_speaking_mission',
    'duplicate_draft_ai_speaking_mission',
    'save_draft_ai_speaking_mission',
    'assert_editable_pronunciation_activity',
    'create_draft_pronunciation_block',
    'save_draft_pronunciation_block',
    'delete_draft_pronunciation_block',
    'reorder_draft_pronunciation_blocks',
    'duplicate_draft_pronunciation_block',
    'create_draft_interactive_practice',
    'save_draft_interactive_practice',
    'duplicate_draft_interactive_practice'
  ];
begin
  for function_row in
    select p.oid, pg_catalog.pg_get_functiondef(p.oid) as definition
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = any (mutation_functions)
  loop
    function_definition := function_row.definition;
    function_definition := replace(
      function_definition,
      'and lesson.status = ''draft''',
      ''
    );
    function_definition := replace(
      function_definition,
      'and unit.status = ''draft''',
      ''
    );
    function_definition := replace(
      function_definition,
      'and course.status = ''draft''',
      ''
    );
    execute function_definition;
  end loop;
end;
$$;

commit;
