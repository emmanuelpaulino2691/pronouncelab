begin;

-- These functions are executable only as triggers. They call internal lock
-- helpers whose EXECUTE privilege is deliberately revoked from API roles, so
-- the trigger boundary must run with its owner's privileges.
alter function public.lock_content_hierarchy_statement()
  security definer;
alter function public.protect_versioned_content()
  security definer;
alter function public.lock_media_statement()
  security definer;
alter function public.protect_published_media_asset()
  security definer;
alter function public.protect_published_lesson_version()
  security definer;
alter function public.protect_sealed_lesson_version_delete()
  security definer;
alter function public.protect_ai_speaking_mission()
  security definer;

revoke all on function public.lock_content_hierarchy_statement()
  from public, anon, authenticated;
revoke all on function public.protect_versioned_content()
  from public, anon, authenticated;
revoke all on function public.lock_media_statement()
  from public, anon, authenticated;
revoke all on function public.protect_published_media_asset()
  from public, anon, authenticated;
revoke all on function public.protect_published_lesson_version()
  from public, anon, authenticated;
revoke all on function public.protect_sealed_lesson_version_delete()
  from public, anon, authenticated;
revoke all on function public.protect_ai_speaking_mission()
  from public, anon, authenticated;

create or replace function public.delete_draft_quiz_question(
  requested_question_id bigint,
  expected_assessment_set_id bigint
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_version_id bigint;
  deleted_question_id bigint;
begin
  perform public.lock_content_hierarchy_gate();

  select activity.lesson_version_id
  into target_version_id
  from public.questions question
  join public.assessment_sets assessment
    on assessment.id = question.assessment_set_id
  join public.lesson_activities activity
    on activity.id = assessment.activity_id
  join public.lesson_versions version
    on version.id = activity.lesson_version_id
  where question.id = requested_question_id
    and question.assessment_set_id = expected_assessment_set_id
    and activity.type = 'quiz'
    and version.status = 'draft'
  for update of question, assessment, activity, version;

  if not found then
    raise exception
      'Draft question does not exist in the expected assessment';
  end if;
  if not public.can_edit_lesson_version(target_version_id) then
    raise exception
      'Course owner or administrator permission is required';
  end if;

  perform 1
  from public.question_options option_row
  where option_row.question_id = requested_question_id
  order by option_row.id
  for update;

  delete from public.question_options
  where question_id = requested_question_id;

  delete from public.questions
  where id = requested_question_id
    and assessment_set_id = expected_assessment_set_id
  returning id into deleted_question_id;

  if deleted_question_id is null then
    raise exception 'Question changed during deletion';
  end if;

  return deleted_question_id;
end;
$$;

revoke all on function public.delete_draft_quiz_question(bigint, bigint)
  from public, anon;
grant execute on function public.delete_draft_quiz_question(bigint, bigint)
  to authenticated;

commit;
