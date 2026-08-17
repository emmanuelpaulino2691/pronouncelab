begin;

create or replace function public.delete_draft_lesson_descendants(
  requested_lesson_id bigint
)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.lesson_versions as version
    where version.lesson_id = requested_lesson_id
      and version.status <> 'draft'
  ) then
    raise exception 'Only lessons with draft versions can be deleted';
  end if;

  delete from public.question_options as option
  using public.questions as question,
    public.assessment_sets as assessment,
    public.lesson_activities as activity,
    public.lesson_versions as version
  where option.question_id = question.id
    and question.assessment_set_id = assessment.id
    and assessment.activity_id = activity.id
    and activity.lesson_version_id = version.id
    and version.lesson_id = requested_lesson_id;

  delete from public.questions as question
  using public.assessment_sets as assessment,
    public.lesson_activities as activity,
    public.lesson_versions as version
  where question.assessment_set_id = assessment.id
    and assessment.activity_id = activity.id
    and activity.lesson_version_id = version.id
    and version.lesson_id = requested_lesson_id;

  delete from public.assessment_sets as assessment
  using public.lesson_activities as activity,
    public.lesson_versions as version
  where assessment.activity_id = activity.id
    and activity.lesson_version_id = version.id
    and version.lesson_id = requested_lesson_id;

  delete from public.theory_blocks as block
  using public.lesson_activities as activity,
    public.lesson_versions as version
  where block.activity_id = activity.id
    and activity.lesson_version_id = version.id
    and version.lesson_id = requested_lesson_id;

  delete from public.listening_items as item
  using public.lesson_activities as activity,
    public.lesson_versions as version
  where item.activity_id = activity.id
    and activity.lesson_version_id = version.id
    and version.lesson_id = requested_lesson_id;

  delete from public.pronunciation_items as item
  using public.lesson_activities as activity,
    public.lesson_versions as version
  where item.activity_id = activity.id
    and activity.lesson_version_id = version.id
    and version.lesson_id = requested_lesson_id;

  delete from public.ai_speaking_missions as mission
  using public.lesson_activities as activity,
    public.lesson_versions as version
  where mission.activity_id = activity.id
    and activity.lesson_version_id = version.id
    and version.lesson_id = requested_lesson_id;

  delete from public.lesson_activities as activity
  using public.lesson_versions as version
  where activity.lesson_version_id = version.id
    and version.lesson_id = requested_lesson_id;

  delete from public.lesson_versions
  where lesson_id = requested_lesson_id;
end;
$$;

revoke all on function public.delete_draft_lesson_descendants(bigint)
  from public;

create or replace function public.delete_draft_course(
  requested_course_id bigint
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_id bigint;
  lesson_row record;
begin
  perform public.lock_content_hierarchy_gate();

  if not public.can_edit_drafts() then
    raise exception 'Draft editing permission is required';
  end if;

  perform 1
  from public.courses as course
  where course.id = requested_course_id
    and course.status = 'draft'
  for update;

  if not found then
    raise exception 'The requested draft course is unavailable';
  end if;

  if exists (
    select 1
    from public.units as unit
    left join public.lessons as lesson on lesson.unit_id = unit.id
    where unit.course_id = requested_course_id
      and (
        unit.status <> 'draft'
        or lesson.status <> 'draft'
        or lesson.current_published_version_id is not null
      )
  ) then
    raise exception 'The course contains sealed curriculum content';
  end if;

  for lesson_row in
    select lesson.id
    from public.lessons as lesson
    join public.units as unit on unit.id = lesson.unit_id
    where unit.course_id = requested_course_id
    order by lesson.id
    for update of lesson
  loop
    perform public.delete_draft_lesson_descendants(lesson_row.id);
  end loop;

  delete from public.lessons as lesson
  using public.units as unit
  where lesson.unit_id = unit.id
    and unit.course_id = requested_course_id;

  delete from public.units where course_id = requested_course_id;
  delete from public.courses
  where id = requested_course_id
  returning id into deleted_id;

  return deleted_id;
end;
$$;

create or replace function public.delete_draft_unit(
  requested_unit_id bigint,
  expected_course_id bigint
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_id bigint;
  lesson_row record;
begin
  perform public.lock_content_hierarchy_gate();

  if not public.can_edit_drafts() then
    raise exception 'Draft editing permission is required';
  end if;

  perform 1
  from public.units as unit
  join public.courses as course on course.id = unit.course_id
  where unit.id = requested_unit_id
    and unit.course_id = expected_course_id
    and unit.status = 'draft'
    and course.status = 'draft'
  for update of course, unit;

  if not found then
    raise exception 'The requested draft unit is unavailable in the expected course';
  end if;

  if exists (
    select 1
    from public.lessons as lesson
    where lesson.unit_id = requested_unit_id
      and (
        lesson.status <> 'draft'
        or lesson.current_published_version_id is not null
      )
  ) then
    raise exception 'The unit contains sealed lesson content';
  end if;

  for lesson_row in
    select lesson.id
    from public.lessons as lesson
    where lesson.unit_id = requested_unit_id
    order by lesson.id
    for update
  loop
    perform public.delete_draft_lesson_descendants(lesson_row.id);
  end loop;

  delete from public.lessons where unit_id = requested_unit_id;
  delete from public.units
  where id = requested_unit_id
    and course_id = expected_course_id
  returning id into deleted_id;

  return deleted_id;
end;
$$;

create or replace function public.delete_draft_lesson(
  requested_lesson_id bigint,
  expected_unit_id bigint
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_id bigint;
begin
  perform public.lock_content_hierarchy_gate();

  if not public.can_edit_drafts() then
    raise exception 'Draft editing permission is required';
  end if;

  perform 1
  from public.lessons as lesson
  join public.units as unit on unit.id = lesson.unit_id
  join public.courses as course on course.id = unit.course_id
  where lesson.id = requested_lesson_id
    and lesson.unit_id = expected_unit_id
    and lesson.status = 'draft'
    and lesson.current_published_version_id is null
    and unit.status = 'draft'
    and course.status = 'draft'
  for update of course, unit, lesson;

  if not found then
    raise exception 'The requested draft lesson is unavailable in the expected unit';
  end if;

  perform public.delete_draft_lesson_descendants(requested_lesson_id);

  delete from public.lessons
  where id = requested_lesson_id
    and unit_id = expected_unit_id
  returning id into deleted_id;

  return deleted_id;
end;
$$;

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
begin
  perform public.lock_content_hierarchy_gate();

  if not public.can_edit_drafts() then
    raise exception 'Draft editing permission is required';
  end if;

  perform 1
  from public.lesson_activities as activity
  join public.lesson_versions as version
    on version.id = activity.lesson_version_id
  join public.lessons as lesson on lesson.id = version.lesson_id
  join public.units as unit on unit.id = lesson.unit_id
  join public.courses as course on course.id = unit.course_id
  where activity.id = requested_activity_id
    and activity.lesson_version_id = expected_lesson_version_id
    and version.status = 'draft'
    and lesson.status = 'draft'
    and unit.status = 'draft'
    and course.status = 'draft'
  for update of course, unit, lesson, version, activity;

  if not found then
    raise exception 'The requested activity is unavailable in the expected lesson draft';
  end if;

  delete from public.question_options as option
  using public.questions as question,
    public.assessment_sets as assessment
  where option.question_id = question.id
    and question.assessment_set_id = assessment.id
    and assessment.activity_id = requested_activity_id;

  delete from public.questions as question
  using public.assessment_sets as assessment
  where question.assessment_set_id = assessment.id
    and assessment.activity_id = requested_activity_id;

  delete from public.assessment_sets
  where activity_id = requested_activity_id;
  delete from public.theory_blocks
  where activity_id = requested_activity_id;
  delete from public.listening_items
  where activity_id = requested_activity_id;
  delete from public.pronunciation_items
  where activity_id = requested_activity_id;
  delete from public.ai_speaking_missions
  where activity_id = requested_activity_id;

  delete from public.lesson_activities
  where id = requested_activity_id
    and lesson_version_id = expected_lesson_version_id
  returning id into deleted_id;

  return deleted_id;
end;
$$;

revoke all on function public.delete_draft_course(bigint) from public;
revoke all on function public.delete_draft_unit(bigint, bigint) from public;
revoke all on function public.delete_draft_lesson(bigint, bigint) from public;
revoke all on function public.delete_draft_lesson_activity(bigint, bigint)
  from public;

grant execute on function public.delete_draft_course(bigint) to authenticated;
grant execute on function public.delete_draft_unit(bigint, bigint)
  to authenticated;
grant execute on function public.delete_draft_lesson(bigint, bigint)
  to authenticated;
grant execute on function public.delete_draft_lesson_activity(bigint, bigint)
  to authenticated;

commit;
