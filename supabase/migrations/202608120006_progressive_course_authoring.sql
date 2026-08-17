begin;

drop policy if exists "units_mutate_owned_draft" on public.units;
create policy "units_update_owned_draft"
on public.units for update to authenticated
using (
  public.can_edit_content_row('units', to_jsonb(units.*))
  and status = 'draft'
)
with check (
  public.can_edit_content_row('units', to_jsonb(units.*))
  and status = 'draft'
);
create policy "units_delete_owned_draft"
on public.units for delete to authenticated
using (
  public.can_edit_content_row('units', to_jsonb(units.*))
  and status = 'draft'
);

drop policy if exists "lessons_mutate_owned_draft" on public.lessons;
create policy "lessons_update_owned_draft"
on public.lessons for update to authenticated
using (
  public.can_edit_content_row('lessons', to_jsonb(lessons.*))
  and status = 'draft'
  and current_published_version_id is null
)
with check (
  public.can_edit_content_row('lessons', to_jsonb(lessons.*))
  and status = 'draft'
  and current_published_version_id is null
);
create policy "lessons_delete_owned_draft"
on public.lessons for delete to authenticated
using (
  public.can_edit_content_row('lessons', to_jsonb(lessons.*))
  and status = 'draft'
  and current_published_version_id is null
);

create or replace function public.create_draft_unit(
  requested_course_id bigint,
  requested_title text,
  requested_description text default ''
)
returns public.units
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.units%rowtype;
  next_position integer;
begin
  perform public.lock_content_hierarchy_gate();

  perform 1 from public.courses course
  where course.id = requested_course_id
  for update;
  if not found then raise exception 'Course does not exist'; end if;
  if not public.can_edit_course(requested_course_id) then
    raise exception 'Course owner or administrator permission is required';
  end if;
  if nullif(pg_catalog.btrim(requested_title), '') is null then
    raise exception 'Unit title is required';
  end if;

  perform 1 from public.units unit
  where unit.course_id = requested_course_id
  order by unit.id for update;
  select coalesce(max(unit.position), -1) + 1 into next_position
  from public.units unit where unit.course_id = requested_course_id;

  insert into public.units (
    course_id, title, description, position, status, created_by, updated_by
  ) values (
    requested_course_id, pg_catalog.btrim(requested_title),
    coalesce(requested_description, ''), next_position, 'draft',
    auth.uid(), auth.uid()
  ) returning * into result;
  return result;
end;
$$;

create or replace function public.create_draft_lesson(
  requested_unit_id bigint,
  requested_title text,
  requested_description text default ''
)
returns public.lessons
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.lessons%rowtype;
  target_course_id bigint;
  next_position integer;
begin
  perform public.lock_content_hierarchy_gate();

  select unit.course_id into target_course_id
  from public.units unit
  where unit.id = requested_unit_id
  for update;
  if not found then raise exception 'Unit does not exist'; end if;
  if not public.can_edit_course(target_course_id) then
    raise exception 'Course owner or administrator permission is required';
  end if;
  if nullif(pg_catalog.btrim(requested_title), '') is null then
    raise exception 'Lesson title is required';
  end if;

  perform 1 from public.lessons lesson
  where lesson.unit_id = requested_unit_id
  order by lesson.id for update;
  select coalesce(max(lesson.position), -1) + 1 into next_position
  from public.lessons lesson where lesson.unit_id = requested_unit_id;

  insert into public.lessons (
    unit_id, title, description, position, status,
    current_published_version_id, created_by, updated_by
  ) values (
    requested_unit_id, pg_catalog.btrim(requested_title),
    coalesce(requested_description, ''), next_position, 'draft', null,
    auth.uid(), auth.uid()
  ) returning * into result;

  insert into public.lesson_versions (
    lesson_id, version_number, status, created_by
  ) values (result.id, 1, 'draft', auth.uid());
  return result;
end;
$$;

create or replace function public.delete_draft_unit(
  requested_unit_id bigint,
  expected_course_id bigint
)
returns bigint language plpgsql security definer set search_path = '' as $$
declare deleted_id bigint; lesson_row record;
begin
  perform public.lock_content_hierarchy_gate();
  perform 1 from public.units unit
  where unit.id = requested_unit_id
    and unit.course_id = expected_course_id
    and unit.status = 'draft' for update;
  if not found then
    raise exception 'The requested draft unit is unavailable in the expected course';
  end if;
  if not public.can_edit_course(expected_course_id) then
    raise exception 'Course owner or administrator permission is required';
  end if;
  if exists (
    select 1 from public.lessons lesson
    where lesson.unit_id = requested_unit_id
      and (lesson.status <> 'draft' or lesson.current_published_version_id is not null)
  ) then raise exception 'The unit contains sealed lesson content'; end if;
  for lesson_row in select lesson.id from public.lessons lesson
    where lesson.unit_id = requested_unit_id order by lesson.id for update
  loop perform public.delete_draft_lesson_descendants(lesson_row.id); end loop;
  delete from public.lessons where unit_id = requested_unit_id;
  delete from public.units where id = requested_unit_id
    and course_id = expected_course_id returning id into deleted_id;
  return deleted_id;
end; $$;

create or replace function public.delete_draft_lesson(
  requested_lesson_id bigint,
  expected_unit_id bigint
)
returns bigint language plpgsql security definer set search_path = '' as $$
declare deleted_id bigint; target_course_id bigint;
begin
  perform public.lock_content_hierarchy_gate();
  select unit.course_id into target_course_id
  from public.lessons lesson join public.units unit on unit.id = lesson.unit_id
  where lesson.id = requested_lesson_id
    and lesson.unit_id = expected_unit_id
    and lesson.status = 'draft'
    and lesson.current_published_version_id is null
  for update of unit, lesson;
  if not found then
    raise exception 'The requested draft lesson is unavailable in the expected unit';
  end if;
  if not public.can_edit_course(target_course_id) then
    raise exception 'Course owner or administrator permission is required';
  end if;
  perform public.delete_draft_lesson_descendants(requested_lesson_id);
  delete from public.lessons where id = requested_lesson_id
    and unit_id = expected_unit_id returning id into deleted_id;
  return deleted_id;
end; $$;

revoke all on function public.create_draft_unit(bigint,text,text) from public, anon;
revoke all on function public.create_draft_lesson(bigint,text,text) from public, anon;
revoke all on function public.delete_draft_unit(bigint,bigint) from public, anon;
revoke all on function public.delete_draft_lesson(bigint,bigint) from public, anon;
grant execute on function public.create_draft_unit(bigint,text,text) to authenticated;
grant execute on function public.create_draft_lesson(bigint,text,text) to authenticated;
grant execute on function public.delete_draft_unit(bigint,bigint) to authenticated;
grant execute on function public.delete_draft_lesson(bigint,bigint) to authenticated;

commit;
