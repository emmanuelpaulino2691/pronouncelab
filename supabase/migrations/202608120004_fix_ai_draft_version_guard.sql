begin;

create or replace function public.protect_ai_speaking_mission()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  parent_activity_id bigint;
  parent_version_id bigint;
begin
  perform public.lock_content_hierarchy_gate();

  if tg_op = 'UPDATE'
    and new.activity_id is distinct from old.activity_id
  then
    raise exception 'AI speaking mission parent is immutable';
  end if;

  parent_activity_id := case
    when tg_op = 'DELETE' then old.activity_id
    else new.activity_id
  end;

  select version.id
  into parent_version_id
  from public.lesson_activities activity
  join public.lesson_versions version
    on version.id = activity.lesson_version_id
  join public.lessons lesson
    on lesson.id = version.lesson_id
  join public.units unit
    on unit.id = lesson.unit_id
  join public.courses course
    on course.id = unit.course_id
  where activity.id = parent_activity_id
    and activity.type = 'ai_speaking_mission'
    and version.status = 'draft'
  for update of activity, version, lesson, unit, course;

  if not found then
    raise exception 'The expected draft AI speaking mission is unavailable';
  end if;
  if not public.can_edit_lesson_version(parent_version_id) then
    raise exception 'Course owner or administrator permission is required';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function public.protect_ai_speaking_mission()
  from public, anon, authenticated;

commit;
