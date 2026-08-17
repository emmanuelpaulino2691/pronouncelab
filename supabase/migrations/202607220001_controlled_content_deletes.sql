begin;

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
revoke all on function public.delete_draft_lesson_activity(bigint, bigint) from public;

grant execute on function public.delete_draft_course(bigint) to authenticated;
grant execute on function public.delete_draft_unit(bigint, bigint) to authenticated;
grant execute on function public.delete_draft_lesson(bigint, bigint) to authenticated;
grant execute on function public.delete_draft_lesson_activity(bigint, bigint) to authenticated;

commit;
