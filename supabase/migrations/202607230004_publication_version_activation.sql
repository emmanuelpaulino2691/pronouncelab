begin;

create or replace function public.protect_publishable_content()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  old_content jsonb;
  new_content jsonb;
  publishable_fields text[] := array[
    'status', 'published_at', 'updated_at', 'updated_by'
  ];
  sealed_fields text[] := array[
    'status', 'updated_at', 'updated_by'
  ];
begin
  if tg_op = 'DELETE' then
    if old.status in ('published', 'unpublished', 'archived') then
      raise exception 'Published or retired % records are immutable', tg_table_name;
    end if;
    return old;
  end if;

  if tg_table_name = 'lessons' then
    publishable_fields := publishable_fields || array['current_published_version_id'];
    sealed_fields := sealed_fields || array['current_published_version_id'];
  end if;

  if old.status = 'draft' and new.status = 'published' then
    old_content := to_jsonb(old) - publishable_fields;
    new_content := to_jsonb(new) - publishable_fields;
    if new_content is distinct from old_content then
      raise exception 'Publishing cannot rewrite % content', tg_table_name;
    end if;
  end if;

  if old.status in ('published', 'unpublished', 'archived') then
    if new.status = 'draft'
      or (old.status = 'archived' and new.status <> 'archived')
    then
      raise exception 'Invalid lifecycle transition for sealed % record', tg_table_name;
    end if;

    old_content := to_jsonb(old) - sealed_fields;
    new_content := to_jsonb(new) - sealed_fields;
    if new_content is distinct from old_content then
      raise exception 'Published or retired % records are immutable', tg_table_name;
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.publish_lesson_version(
  requested_lesson_version_id bigint
)
returns public.lesson_versions
language plpgsql
security definer
set search_path = ''
as $$
declare
  version_row public.lesson_versions%rowtype;
  published_version public.lesson_versions%rowtype;
  previous_published_id bigint;
  lesson_id bigint;
  unit_id bigint;
  course_id bigint;
begin
  perform public.lock_content_hierarchy_gate();

  select version.*
  into version_row
  from public.lesson_versions version
  join public.lessons lesson on lesson.id = version.lesson_id
  join public.units unit on unit.id = lesson.unit_id
  where version.id = requested_lesson_version_id
  for update of version, lesson, unit;

  if not found then
    raise exception 'Lesson version does not exist';
  end if;

  select lesson.id, lesson.unit_id, unit.course_id
  into strict lesson_id, unit_id, course_id
  from public.lessons lesson
  join public.units unit on unit.id = lesson.unit_id
  where lesson.id = version_row.lesson_id;
  if not public.can_publish_course(course_id) then
    raise exception 'Course publication permission is required';
  end if;
  if version_row.status <> 'draft' then
    raise exception 'Only a draft lesson version can be published';
  end if;

  perform public.validate_lesson_version_listening_audio(version_row.id);
  perform public.validate_lesson_version_pronunciation_blocks(version_row.id);
  perform public.validate_lesson_version_media(version_row.id);
  perform public.validate_lesson_version_ai_missions(version_row.id);
  perform public.validate_lesson_version_interactive_practice(version_row.id);

  select lesson.current_published_version_id
  into previous_published_id
  from public.lessons lesson
  where lesson.id = lesson_id
  for update;

  perform pg_catalog.set_config('pronouncelab.lesson_publication', 'on', true);

  if previous_published_id is not null
    and previous_published_id <> version_row.id
  then
    update public.lesson_versions
    set status = 'archived'
    where id = previous_published_id;
  end if;

  update public.lesson_versions
  set status = 'published', published_by = auth.uid(), published_at = pg_catalog.now()
  where id = version_row.id and status = 'draft'
  returning * into published_version;

  if not found then
    raise exception 'Lesson version changed during publication';
  end if;

  update public.lessons
  set status = 'published', current_published_version_id = published_version.id,
    published_at = pg_catalog.now(), updated_by = auth.uid()
  where id = lesson_id;

  update public.units
  set status = 'published', published_at = coalesce(published_at, pg_catalog.now()),
    updated_by = auth.uid()
  where id = unit_id and status = 'draft';

  update public.courses
  set status = 'published', published_at = coalesce(published_at, pg_catalog.now()),
    updated_by = auth.uid()
  where id = course_id and status = 'draft';

  return published_version;
end;
$$;

revoke all on function public.publish_lesson_version(bigint) from public;
grant execute on function public.publish_lesson_version(bigint) to authenticated;

commit;
