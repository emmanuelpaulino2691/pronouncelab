-- Sprint 38: atomic draft hierarchy duplication. Published history and learner
-- data are never copied; media rows are referenced, not physically duplicated.

create or replace function public.next_copy_title(
  source_title text,
  entity_table regclass,
  parent_column text default null,
  parent_id bigint default null
)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare candidate text; base_title text; copy_number integer := 1; exists_already boolean;
begin
  base_title := pg_catalog.regexp_replace(source_title, ' \(Copy( [0-9]+)?\)$', '');
  loop
    candidate := base_title || case when copy_number = 1 then ' (Copy)' else ' (Copy ' || copy_number || ')' end;
    if parent_column is null then
      execute pg_catalog.format('select exists(select 1 from %s where title = $1)', entity_table)
        into exists_already using candidate;
    else
      execute pg_catalog.format('select exists(select 1 from %s where %I = $1 and title = $2)', entity_table, parent_column)
        into exists_already using parent_id, candidate;
    end if;
    if not exists_already then return candidate; end if;
    copy_number := copy_number + 1;
  end loop;
end;
$$;

create or replace function public.copy_draft_activity_tree(
  source_activity_id bigint,
  destination_version_id bigint
)
returns public.lesson_activities
language plpgsql
security definer
set search_path = ''
as $$
declare
  source_activity public.lesson_activities%rowtype;
  copied_activity public.lesson_activities%rowtype;
  source_listening record; copied_listening_id bigint;
  source_assessment record; copied_assessment_id bigint; mapped_listening_id bigint;
  source_question record; copied_question_id bigint;
begin
  select * into strict source_activity from public.lesson_activities where id = source_activity_id;
  if source_activity.type = 'ai_speaking_mission' then
    perform pg_catalog.set_config('pronouncelab.ai_mission_creation', 'on', true);
  end if;
  insert into public.lesson_activities (lesson_version_id, type, title, position, required)
    values (destination_version_id, source_activity.type, source_activity.title, source_activity.position, source_activity.required)
    returning * into copied_activity;

  insert into public.theory_blocks (activity_id, block_type, position, heading_level, title, text, media_asset_id, alt_text)
    select copied_activity.id, block_type, position, heading_level, title, text, media_asset_id, alt_text
    from public.theory_blocks where activity_id = source_activity.id order by position, id;

  for source_listening in select * from public.listening_items where activity_id = source_activity.id order by position, id loop
    insert into public.listening_items (activity_id, title, instructions, transcript, audio_asset_id, position)
      values (copied_activity.id, source_listening.title, source_listening.instructions, source_listening.transcript, source_listening.audio_asset_id, source_listening.position)
      returning id into copied_listening_id;
  end loop;

  insert into public.pronunciation_items (activity_id, title, instructions, display_text, block_type, spelling_pattern, entries, audio_asset_id, position)
    select copied_activity.id, title, instructions, display_text, block_type, spelling_pattern, entries, audio_asset_id, position
    from public.pronunciation_items where activity_id = source_activity.id order by position, id;

  for source_assessment in select * from public.assessment_sets where activity_id = source_activity.id order by position, id loop
    mapped_listening_id := null;
    if source_assessment.listening_item_id is not null then
      select target.id into mapped_listening_id
      from public.listening_items source
      join public.listening_items target on target.activity_id = copied_activity.id and target.position = source.position
      where source.id = source_assessment.listening_item_id;
      if mapped_listening_id is null then raise exception 'Unable to map duplicated listening assessment'; end if;
    end if;
    insert into public.assessment_sets (activity_id, listening_item_id, title, instructions, position)
      values (copied_activity.id, mapped_listening_id, source_assessment.title, source_assessment.instructions, source_assessment.position)
      returning id into copied_assessment_id;
    for source_question in select * from public.questions where assessment_set_id = source_assessment.id order by position, id loop
      insert into public.questions (assessment_set_id, prompt, explanation, position, required)
        values (copied_assessment_id, source_question.prompt, source_question.explanation, source_question.position, source_question.required)
        returning id into copied_question_id;
      insert into public.question_options (question_id, text, position, is_correct)
        select copied_question_id, text, position, is_correct from public.question_options
        where question_id = source_question.id order by position, id;
    end loop;
  end loop;

  insert into public.ai_speaking_missions (activity_id, config)
    select copied_activity.id, config from public.ai_speaking_missions where activity_id = source_activity.id;
  if source_activity.type = 'ai_speaking_mission' then
    perform pg_catalog.set_config('pronouncelab.ai_mission_creation', 'off', true);
  end if;
  return copied_activity;
end;
$$;

create or replace function public.copy_draft_lesson_tree(
  source_lesson_id bigint,
  destination_unit_id bigint,
  requested_title text default null
)
returns public.lessons
language plpgsql
security definer
set search_path = ''
as $$
declare source_lesson public.lessons%rowtype; copied_lesson public.lessons%rowtype;
  source_version_id bigint; copied_version_id bigint; next_position integer; activity record; copy_title text;
begin
  select * into source_lesson from public.lessons where id = source_lesson_id and status = 'draft' and current_published_version_id is null for update;
  if not found then raise exception 'Only an unpublished draft lesson can be duplicated'; end if;
  perform 1 from public.units unit join public.courses course on course.id = unit.course_id
    where unit.id = destination_unit_id and unit.status = 'draft' and course.status = 'draft' for update of unit, course;
  if not found then raise exception 'The destination unit is not editable'; end if;
  perform 1 from public.lessons where unit_id = destination_unit_id order by id for update;
  select coalesce(max(position), -1) + 1 into next_position from public.lessons where unit_id = destination_unit_id;
  copy_title := coalesce(nullif(pg_catalog.btrim(requested_title), ''), public.next_copy_title(source_lesson.title, 'public.lessons', 'unit_id', destination_unit_id));
  insert into public.lessons (unit_id, title, description, position, status, current_published_version_id, created_by, updated_by)
    values (destination_unit_id, copy_title, source_lesson.description, next_position, 'draft', null, auth.uid(), auth.uid()) returning * into copied_lesson;
  select id into source_version_id from public.lesson_versions where lesson_id = source_lesson.id and status = 'draft' order by version_number desc limit 1;
  if source_version_id is not null then
    insert into public.lesson_versions (lesson_id, version_number, status, created_by)
      values (copied_lesson.id, 1, 'draft', auth.uid()) returning id into copied_version_id;
    for activity in select id from public.lesson_activities where lesson_version_id = source_version_id order by position, id loop
      perform public.copy_draft_activity_tree(activity.id, copied_version_id);
    end loop;
  end if;
  return copied_lesson;
end;
$$;

create or replace function public.duplicate_draft_lesson(requested_lesson_id bigint, expected_unit_id bigint)
returns public.lessons language plpgsql security definer set search_path = '' as $$
declare result public.lessons%rowtype;
begin
  perform public.lock_content_hierarchy_gate();
  if not public.can_edit_drafts() then raise exception 'Draft editing permission is required'; end if;
  perform 1 from public.lessons where id = requested_lesson_id and unit_id = expected_unit_id;
  if not found then raise exception 'Lesson not found in the expected unit'; end if;
  result := public.copy_draft_lesson_tree(requested_lesson_id, expected_unit_id, null);
  return result;
end; $$;

create or replace function public.duplicate_draft_unit(requested_unit_id bigint, expected_course_id bigint)
returns public.units language plpgsql security definer set search_path = '' as $$
declare source_unit public.units%rowtype; result public.units%rowtype; lesson record; next_position integer; copy_title text;
begin
  perform public.lock_content_hierarchy_gate();
  if not public.can_edit_drafts() then raise exception 'Draft editing permission is required'; end if;
  select unit.* into source_unit from public.units unit join public.courses course on course.id = unit.course_id
    where unit.id = requested_unit_id and unit.course_id = expected_course_id and unit.status = 'draft' and course.status = 'draft'
    for update of unit, course;
  if not found then raise exception 'Only a unit in an editable draft course can be duplicated'; end if;
  perform 1 from public.units where course_id = expected_course_id order by id for update;
  select coalesce(max(position), -1) + 1 into next_position from public.units where course_id = expected_course_id;
  copy_title := public.next_copy_title(source_unit.title, 'public.units', 'course_id', expected_course_id);
  insert into public.units (course_id, title, description, position, status, created_by, updated_by)
    values (expected_course_id, copy_title, source_unit.description, next_position, 'draft', auth.uid(), auth.uid()) returning * into result;
  for lesson in select id, title from public.lessons where unit_id = source_unit.id and status = 'draft' and current_published_version_id is null order by position, id loop
    perform public.copy_draft_lesson_tree(lesson.id, result.id, lesson.title);
  end loop;
  return result;
end; $$;

-- Internal unit copier used by course duplication without reacquiring the gate.
create or replace function public.duplicate_draft_unit_into_course(source_unit_id bigint, destination_course_id bigint, requested_title text)
returns public.units language plpgsql security definer set search_path = '' as $$
declare source_unit public.units%rowtype; result public.units%rowtype; lesson record; next_position integer;
begin
  select * into strict source_unit from public.units where id = source_unit_id and status = 'draft';
  select coalesce(max(position), -1) + 1 into next_position from public.units where course_id = destination_course_id;
  insert into public.units (course_id, title, description, position, status, created_by, updated_by)
    values (destination_course_id, requested_title, source_unit.description, next_position, 'draft', auth.uid(), auth.uid()) returning * into result;
  for lesson in select id, title from public.lessons where unit_id = source_unit.id and status = 'draft' and current_published_version_id is null order by position, id loop
    perform public.copy_draft_lesson_tree(lesson.id, result.id, lesson.title);
  end loop;
  return result;
end; $$;

create or replace function public.duplicate_draft_course(requested_course_id bigint)
returns public.courses language plpgsql security definer set search_path = '' as $$
declare source_course public.courses%rowtype; result public.courses%rowtype; unit record;
  next_position integer; copy_title text; copy_slug text; base_slug text; suffix integer := 1;
begin
  perform public.lock_content_hierarchy_gate();
  if not public.can_edit_drafts() then raise exception 'Draft editing permission is required'; end if;
  select * into source_course from public.courses where id = requested_course_id and status = 'draft' for update;
  if not found then raise exception 'Only a draft course can be duplicated'; end if;
  perform 1 from public.courses order by id for update;
  select coalesce(max(position), -1) + 1 into next_position from public.courses;
  copy_title := public.next_copy_title(source_course.title, 'public.courses');
  base_slug := pg_catalog.regexp_replace(source_course.slug, '-copy(-[0-9]+)?$', '');
  loop
    copy_slug := base_slug || case when suffix = 1 then '-copy' else '-copy-' || suffix end;
    exit when not exists (select 1 from public.courses where slug = copy_slug);
    suffix := suffix + 1;
  end loop;
  insert into public.courses (slug, title, description, level, emoji, position, status, created_by, updated_by)
    values (copy_slug, copy_title, source_course.description, source_course.level, source_course.emoji, next_position, 'draft', auth.uid(), auth.uid()) returning * into result;
  for unit in select id, title from public.units where course_id = source_course.id and status = 'draft' order by position, id loop
    perform public.duplicate_draft_unit_into_course(unit.id, result.id, unit.title);
  end loop;
  return result;
end; $$;

revoke all on function public.next_copy_title(text, regclass, text, bigint) from public, anon, authenticated;
revoke all on function public.copy_draft_activity_tree(bigint, bigint) from public, anon, authenticated;
revoke all on function public.copy_draft_lesson_tree(bigint, bigint, text) from public, anon, authenticated;
revoke all on function public.duplicate_draft_unit_into_course(bigint, bigint, text) from public, anon, authenticated;
revoke all on function public.duplicate_draft_course(bigint) from public, anon;
revoke all on function public.duplicate_draft_unit(bigint, bigint) from public, anon;
revoke all on function public.duplicate_draft_lesson(bigint, bigint) from public, anon;
grant execute on function public.duplicate_draft_course(bigint) to authenticated;
grant execute on function public.duplicate_draft_unit(bigint, bigint) to authenticated;
grant execute on function public.duplicate_draft_lesson(bigint, bigint) to authenticated;
