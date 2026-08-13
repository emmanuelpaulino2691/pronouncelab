begin;

-- Learn audio transcripts are stored in theory_blocks.text. Keep the existing
-- answer-safe projection intact and extend only its audio object.
do $$
declare
  definition text;
  updated_definition text;
begin
  select pg_catalog.pg_get_functiondef(
    'public.learner_published_activity_projection(bigint)'::regprocedure
  ) into definition;
  updated_definition := pg_catalog.regexp_replace(
    definition,
    $pattern$(block\.media_asset_id[[:space:]]+\))[[:space:]]+\)([[:space:]]+end)$pattern$,
    $replacement$\1,
                    'label', coalesce(block.title, ''),
                    'transcript', coalesce(block.text, '')
                  )\2$replacement$
  );
  if updated_definition = definition then
    raise exception 'Expected Learn audio projection fragment was not found';
  end if;
  execute updated_definition;
end;
$$;

-- Draft activity ownership follows the course owner, but published ancestors
-- no longer freeze a new draft lesson version. Deletion remains parent-scoped.
create or replace function public.delete_draft_lesson_activity(
  requested_activity_id bigint,
  expected_lesson_version_id bigint
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_id bigint;
  target_course_id bigint;
begin
  perform public.lock_content_hierarchy_gate();

  select unit.course_id into target_course_id
  from public.lesson_activities activity
  join public.lesson_versions version on version.id = activity.lesson_version_id
  join public.lessons lesson on lesson.id = version.lesson_id
  join public.units unit on unit.id = lesson.unit_id
  join public.courses course on course.id = unit.course_id
  where activity.id = requested_activity_id
    and activity.lesson_version_id = expected_lesson_version_id
    and version.status = 'draft'
  for update of course, unit, lesson, version, activity;

  if not found then
    raise exception 'The requested activity is unavailable in the expected lesson draft';
  end if;
  if not public.can_edit_course(target_course_id) then
    raise exception 'Course owner or administrator permission is required';
  end if;

  delete from public.question_options option
  using public.questions question, public.assessment_sets assessment
  where option.question_id = question.id
    and question.assessment_set_id = assessment.id
    and assessment.activity_id = requested_activity_id;
  delete from public.questions question
  using public.assessment_sets assessment
  where question.assessment_set_id = assessment.id
    and assessment.activity_id = requested_activity_id;
  delete from public.assessment_sets where activity_id = requested_activity_id;
  delete from public.theory_blocks where activity_id = requested_activity_id;
  delete from public.listening_items where activity_id = requested_activity_id;
  delete from public.pronunciation_items where activity_id = requested_activity_id;
  delete from public.ai_speaking_missions where activity_id = requested_activity_id;
  delete from public.interactive_practice_exercises where activity_id = requested_activity_id;
  delete from public.lesson_activities
  where id = requested_activity_id
    and lesson_version_id = expected_lesson_version_id
  returning id into deleted_id;
  return deleted_id;
end;
$$;

revoke all on function public.delete_draft_lesson_activity(bigint,bigint)
  from public, anon;
grant execute on function public.delete_draft_lesson_activity(bigint,bigint)
  to authenticated;

-- Course update validation concerns only rows that can change: new draft
-- structure and draft lesson versions. Historical published rows are already
-- sealed and must not become blockers when validators evolve.
do $$
declare
  definition text;
  updated_definition text;
begin
  select pg_catalog.pg_get_functiondef('public.publish_course(bigint)'::regprocedure)
  into definition;
  updated_definition := definition;

  updated_definition := pg_catalog.replace(
    updated_definition,
    $old$    if not exists (select 1 from public.lessons where unit_id = unit_row.id) then
      errors := errors || jsonb_build_object('courseId', course_row.id, 'courseTitle', course_row.title, 'unitId', unit_row.id, 'unitTitle', unit_row.title, 'category', 'unit', 'message', 'Add at least one lesson before publishing this unit.');
    end if;$old$,
    $new$    if not exists (select 1 from public.lessons where unit_id = unit_row.id) then
      errors := errors || jsonb_build_object('courseId', course_row.id, 'courseTitle', course_row.title, 'unitId', unit_row.id, 'unitTitle', unit_row.title, 'category', 'unit', 'message', 'Add at least one lesson before publishing this new draft unit.');
    end if;$new$
  );
  updated_definition := pg_catalog.regexp_replace(
    updated_definition,
    $pattern$(select version\.\* into version_row from public\.lesson_versions version where version\.id = selected_version_id;)([[:space:]]+)(if not exists)$pattern$,
    $replacement$\1\2if version_row.status = 'draft' then\2\3$replacement$
  );
  updated_definition := pg_catalog.regexp_replace(
    updated_definition,
    $pattern$(        end if;)([[:space:]]+)(      end if;[[:space:]]+      selected_version_id := null;)$pattern$,
    $replacement$\1\2        end if;\2\3$replacement$
  );
  updated_definition := pg_catalog.replace(
    updated_definition,
    '''activityId'', activity_row.id, ''activityType''',
    '''activityId'', activity_row.id, ''activityTitle'', activity_row.title, ''activityType'''
  );

  if updated_definition = definition
    or pg_catalog.strpos(updated_definition, 'if version_row.status = ''draft'' then') = 0
  then
    raise exception 'Expected publish_course validation fragments were not found';
  end if;
  execute updated_definition;
end;
$$;

commit;
