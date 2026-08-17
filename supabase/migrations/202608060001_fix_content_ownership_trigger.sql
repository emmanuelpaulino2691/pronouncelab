begin;

create or replace function public.enforce_content_ownership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  course_id bigint;
  row_data jsonb;
  old_row_data jsonb;
  publication_active boolean;
begin
  if tg_table_name = 'courses' and tg_op = 'INSERT' then
    if not public.can_create_courses() then
      raise exception 'Teacher or administrator role required';
    end if;

    new := pg_catalog.jsonb_populate_record(
      new,
      pg_catalog.jsonb_build_object(
        'owner_user_id',
        auth.uid()
      )
    );
    return new;
  end if;

  row_data := case
    when tg_op = 'DELETE' then pg_catalog.to_jsonb(old)
    else pg_catalog.to_jsonb(new)
  end;
  old_row_data := case
    when tg_op = 'UPDATE' then pg_catalog.to_jsonb(old)
    else null
  end;

  course_id := public.content_row_course_id(
    tg_table_name,
    row_data
  );

  if course_id is null then
    raise exception 'Unable to resolve content ownership';
  end if;

  if tg_table_name = 'courses'
    and tg_op = 'UPDATE'
    and (row_data ->> 'owner_user_id')
      is distinct from (old_row_data ->> 'owner_user_id')
  then
    raise exception 'Course ownership is immutable';
  end if;

  publication_active :=
    coalesce(
      pg_catalog.current_setting(
        'pronouncelab.lesson_publication',
        true
      ),
      ''
    ) = 'on'
    or (
      tg_op = 'UPDATE'
      and row_data ? 'status'
      and (row_data -> 'status')
        is distinct from (old_row_data -> 'status')
    );

  if publication_active then
    if not public.can_publish_course(course_id) then
      raise exception
        'Course publication permission is required';
    end if;
  elsif not public.can_edit_course(course_id) then
    raise exception
      'Course owner or administrator permission is required';
  end if;

  return case
    when tg_op = 'DELETE' then old
    else new
  end;
end;
$$;

revoke all on function public.enforce_content_ownership()
  from public, anon, authenticated;

commit;
