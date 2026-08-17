begin;

create or replace function public.create_draft_unit(
  requested_course_id bigint,
  requested_title text,
  requested_description text default ''
)
returns public.units language plpgsql security definer set search_path = '' as $$
declare
  result public.units%rowtype;
  append_position integer;
  p_course_id constant bigint := requested_course_id;
begin
  perform public.lock_content_hierarchy_gate();
  perform 1 from public.courses course where course.id = p_course_id for update;
  if not found then raise exception 'Course does not exist'; end if;
  if not public.can_edit_course(p_course_id) then
    raise exception 'Course owner or administrator permission is required';
  end if;
  if nullif(pg_catalog.btrim(requested_title), '') is null then
    raise exception 'Unit title is required';
  end if;
  perform 1 from public.units existing
    where existing.course_id = p_course_id order by existing.id for update;
  append_position := coalesce((
    select max(existing.position) + 1
    from public.units existing where existing.course_id = p_course_id
  ), 0);
  insert into public.units (
    course_id, title, description, position, status, created_by, updated_by
  ) values (
    p_course_id, pg_catalog.btrim(requested_title),
    coalesce(requested_description, ''), append_position, 'draft',
    auth.uid(), auth.uid()
  ) returning * into result;
  return result;
end; $$;

create or replace function public.create_draft_lesson(
  requested_unit_id bigint,
  requested_title text,
  requested_description text default ''
)
returns public.lessons language plpgsql security definer set search_path = '' as $$
declare
  result public.lessons%rowtype;
  target_course_id bigint;
  append_position integer;
  p_unit_id constant bigint := requested_unit_id;
begin
  perform public.lock_content_hierarchy_gate();
  select parent.course_id into target_course_id
  from public.units parent where parent.id = p_unit_id for update;
  if not found then raise exception 'Unit does not exist'; end if;
  if not public.can_edit_course(target_course_id) then
    raise exception 'Course owner or administrator permission is required';
  end if;
  if nullif(pg_catalog.btrim(requested_title), '') is null then
    raise exception 'Lesson title is required';
  end if;
  perform 1 from public.lessons existing
    where existing.unit_id = p_unit_id order by existing.id for update;
  append_position := coalesce((
    select max(existing.position) + 1
    from public.lessons existing where existing.unit_id = p_unit_id
  ), 0);
  insert into public.lessons (
    unit_id, title, description, position, status,
    current_published_version_id, created_by, updated_by
  ) values (
    p_unit_id, pg_catalog.btrim(requested_title),
    coalesce(requested_description, ''), append_position, 'draft', null,
    auth.uid(), auth.uid()
  ) returning * into result;
  insert into public.lesson_versions (
    lesson_id, version_number, status, created_by
  ) values (result.id, 1, 'draft', auth.uid());
  return result;
end; $$;

revoke all on function public.create_draft_unit(bigint,text,text) from public, anon;
revoke all on function public.create_draft_lesson(bigint,text,text) from public, anon;
grant execute on function public.create_draft_unit(bigint,text,text) to authenticated;
grant execute on function public.create_draft_lesson(bigint,text,text) to authenticated;

commit;
