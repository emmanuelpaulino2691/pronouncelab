begin;

alter table public.pronunciation_items
  add column block_type text,
  add column spelling_pattern text,
  add column entries jsonb not null default '[]'::jsonb,
  add constraint pronunciation_items_block_type_valid
    check (block_type is null or block_type in ('word_list', 'minimal_pairs')),
  add constraint pronunciation_items_entries_array
    check (jsonb_typeof(entries) = 'array'),
  add constraint pronunciation_items_pattern_scope
    check (spelling_pattern is null or block_type = 'word_list');

create or replace function public.assert_editable_pronunciation_activity(
  expected_activity_id bigint
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.can_edit_drafts() then
    raise exception 'Draft editing permission is required';
  end if;

  perform 1
  from public.lesson_activities activity
  join public.lesson_versions version on version.id = activity.lesson_version_id
  join public.lessons lesson on lesson.id = version.lesson_id
  join public.units unit on unit.id = lesson.unit_id
  join public.courses course on course.id = unit.course_id
  where activity.id = expected_activity_id
    and activity.type = 'pronunciation'
    and version.status = 'draft'
    and lesson.status = 'draft'
    and unit.status = 'draft'
    and course.status = 'draft'
  for update of activity, version, lesson, unit, course;

  if not found then
    raise exception 'The expected draft pronunciation activity is unavailable';
  end if;
end;
$$;

revoke all on function public.assert_editable_pronunciation_activity(bigint)
  from public, anon, authenticated;

create or replace function public.pronunciation_entries_are_valid(
  requested_block_type text,
  requested_entries jsonb,
  require_content boolean default false
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(requested_entries) = 'array'
    and (not require_content or jsonb_array_length(requested_entries) > 0)
    and case requested_block_type
      when 'word_list' then not exists (
        select 1 from jsonb_array_elements(requested_entries) entry
        where jsonb_typeof(entry) <> 'string'
          or btrim(entry #>> '{}') = ''
      )
      when 'minimal_pairs' then not exists (
        select 1 from jsonb_array_elements(requested_entries) entry
        where jsonb_typeof(entry) <> 'object'
          or jsonb_typeof(entry -> 'left') <> 'string'
          or jsonb_typeof(entry -> 'right') <> 'string'
          or btrim(entry ->> 'left') = ''
          or btrim(entry ->> 'right') = ''
      )
      else false
    end;
$$;

revoke all on function public.pronunciation_entries_are_valid(text, jsonb, boolean)
  from public, anon, authenticated;

create or replace function public.create_draft_pronunciation_block(
  expected_activity_id bigint,
  requested_block_type text,
  requested_title text
)
returns public.pronunciation_items
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.pronunciation_items;
  next_position integer;
begin
  perform public.lock_content_hierarchy_gate();
  perform public.assert_editable_pronunciation_activity(expected_activity_id);

  if requested_block_type not in ('word_list', 'minimal_pairs') then
    raise exception 'Unsupported pronunciation block type';
  end if;
  if btrim(requested_title) = '' then
    raise exception 'Pronunciation block title is required';
  end if;

  perform 1 from public.pronunciation_items
  where activity_id = expected_activity_id order by id for update;
  select coalesce(max(position), -1) + 1 into next_position
  from public.pronunciation_items where activity_id = expected_activity_id;

  insert into public.pronunciation_items (
    activity_id, title, display_text, block_type, entries, position
  ) values (
    expected_activity_id, btrim(requested_title), '', requested_block_type, '[]'::jsonb, next_position
  ) returning * into result;
  return result;
end;
$$;

create or replace function public.save_draft_pronunciation_block(
  requested_item_id bigint,
  expected_activity_id bigint,
  expected_updated_at timestamptz,
  requested_title text,
  requested_instructions text,
  requested_spelling_pattern text,
  requested_audio_asset_id uuid,
  requested_entries jsonb
)
returns public.pronunciation_items
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing public.pronunciation_items;
  result public.pronunciation_items;
begin
  perform public.lock_content_hierarchy_gate();
  perform public.assert_editable_pronunciation_activity(expected_activity_id);
  select * into existing from public.pronunciation_items
  where id = requested_item_id and activity_id = expected_activity_id
  for update;
  if not found or existing.block_type is null then
    raise exception 'The pronunciation block is unavailable';
  end if;
  if existing.updated_at <> expected_updated_at then
    raise exception 'The pronunciation block changed since it was loaded';
  end if;
  if btrim(requested_title) = '' then
    raise exception 'Pronunciation block title is required';
  end if;
  if not public.pronunciation_entries_are_valid(existing.block_type, requested_entries, false) then
    raise exception 'Pronunciation block entries are invalid';
  end if;

  update public.pronunciation_items set
    title = btrim(requested_title),
    instructions = nullif(btrim(requested_instructions), ''),
    spelling_pattern = case when existing.block_type = 'word_list'
      then nullif(btrim(requested_spelling_pattern), '') else null end,
    audio_asset_id = requested_audio_asset_id,
    entries = requested_entries
  where id = requested_item_id and activity_id = expected_activity_id
  returning * into result;
  return result;
end;
$$;

create or replace function public.delete_draft_pronunciation_block(
  requested_item_id bigint,
  expected_activity_id bigint
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.lock_content_hierarchy_gate();
  perform public.assert_editable_pronunciation_activity(expected_activity_id);
  delete from public.pronunciation_items
  where id = requested_item_id and activity_id = expected_activity_id and block_type is not null;
  if not found then raise exception 'The pronunciation block is unavailable'; end if;
end;
$$;

create or replace function public.reorder_draft_pronunciation_blocks(
  expected_activity_id bigint,
  ordered_item_ids bigint[]
)
returns setof public.pronunciation_items
language plpgsql
security definer
set search_path = ''
as $$
declare
  item_count integer;
  temporary_offset integer;
begin
  perform public.lock_content_hierarchy_gate();
  perform public.assert_editable_pronunciation_activity(expected_activity_id);
  perform 1 from public.pronunciation_items
    where activity_id = expected_activity_id order by id for update;

  select count(*) into item_count from public.pronunciation_items
    where activity_id = expected_activity_id;
  if cardinality(ordered_item_ids) <> item_count
    or (select count(distinct requested.id) from unnest(ordered_item_ids) as requested(id)) <> item_count
    or exists (select 1 from unnest(ordered_item_ids) as requested(id)
      where not exists (select 1 from public.pronunciation_items item
        where item.id = requested.id and item.activity_id = expected_activity_id)) then
    raise exception 'Pronunciation block order must contain every item exactly once';
  end if;

  temporary_offset := item_count + 1;
  update public.pronunciation_items set position = position + temporary_offset
    where activity_id = expected_activity_id;
  update public.pronunciation_items item set position = ordered.position
  from (select id, ordinality::integer - 1 position
    from unnest(ordered_item_ids) with ordinality ids(id, ordinality)) ordered
  where item.id = ordered.id and item.activity_id = expected_activity_id;
  return query select * from public.pronunciation_items
    where activity_id = expected_activity_id order by position;
end;
$$;

create or replace function public.validate_lesson_version_pronunciation_blocks(
  requested_lesson_version_id bigint
)
returns void
language plpgsql
set search_path = ''
as $$
declare invalid_item_id bigint;
begin
  select item.id into invalid_item_id
  from public.pronunciation_items item
  join public.lesson_activities activity on activity.id = item.activity_id
  where activity.lesson_version_id = requested_lesson_version_id
    and item.block_type is not null
    and not public.pronunciation_entries_are_valid(item.block_type, item.entries, true)
  order by item.id limit 1 for update of item, activity;
  if found then
    raise exception 'Invalid publication content: pronunciation block % requires valid entries', invalid_item_id;
  end if;
end;
$$;

revoke all on function public.validate_lesson_version_pronunciation_blocks(bigint)
  from public, anon, authenticated;

-- Preserve every pronunciation-specific field when the existing controlled
-- activity duplication operation copies a pronunciation activity.
create or replace function public.duplicate_draft_lesson_activity(
  requested_activity_id bigint,
  expected_lesson_version_id bigint
)
returns public.lesson_activities
language plpgsql security definer set search_path = ''
as $$
declare
  source_activity public.lesson_activities; result public.lesson_activities;
  next_position integer; source_assessment record; copied_assessment_id bigint;
  source_question record; copied_question_id bigint;
begin
  perform public.lock_content_hierarchy_gate();
  if not public.can_edit_drafts() then raise exception 'Draft editing permission is required'; end if;
  select activity.* into source_activity
  from public.lesson_activities activity
  join public.lesson_versions version on version.id = activity.lesson_version_id
  join public.lessons lesson on lesson.id = version.lesson_id
  join public.units unit on unit.id = lesson.unit_id
  join public.courses course on course.id = unit.course_id
  where activity.id = requested_activity_id and activity.lesson_version_id = expected_lesson_version_id
    and version.status = 'draft' and lesson.status = 'draft' and unit.status = 'draft' and course.status = 'draft'
  for update of activity, version, lesson, unit, course;
  if not found then raise exception 'The expected draft activity is unavailable'; end if;
  perform 1 from public.lesson_activities where lesson_version_id = expected_lesson_version_id order by id for update;
  select coalesce(max(position), -1) + 1 into next_position from public.lesson_activities where lesson_version_id = expected_lesson_version_id;
  insert into public.lesson_activities (lesson_version_id, type, title, position, required)
    values (expected_lesson_version_id, source_activity.type, source_activity.title || ' copy', next_position, source_activity.required)
    returning * into result;
  insert into public.theory_blocks (activity_id, block_type, position, heading_level, title, text, media_asset_id, alt_text)
    select result.id, block_type, position, heading_level, title, text, media_asset_id, alt_text from public.theory_blocks where activity_id = requested_activity_id;
  insert into public.listening_items (activity_id, title, instructions, transcript, audio_asset_id, position)
    select result.id, title, instructions, transcript, audio_asset_id, position from public.listening_items where activity_id = requested_activity_id;
  insert into public.pronunciation_items (activity_id, title, instructions, display_text, block_type, spelling_pattern, entries, audio_asset_id, position)
    select result.id, title, instructions, display_text, block_type, spelling_pattern, entries, audio_asset_id, position from public.pronunciation_items where activity_id = requested_activity_id;
  for source_assessment in select * from public.assessment_sets where activity_id = requested_activity_id order by position loop
    if source_assessment.listening_item_id is not null then raise exception 'Activities with linked listening assessments cannot be duplicated safely'; end if;
    insert into public.assessment_sets (activity_id, title, instructions, position)
      values (result.id, source_assessment.title, source_assessment.instructions, source_assessment.position) returning id into copied_assessment_id;
    for source_question in select * from public.questions where assessment_set_id = source_assessment.id order by position loop
      insert into public.questions (assessment_set_id, prompt, explanation, position, required)
        values (copied_assessment_id, source_question.prompt, source_question.explanation, source_question.position, source_question.required) returning id into copied_question_id;
      insert into public.question_options (question_id, text, position, is_correct)
        select copied_question_id, text, position, is_correct from public.question_options where question_id = source_question.id order by position;
    end loop;
  end loop;
  return result;
end;
$$;

create or replace function public.publish_lesson_version(requested_lesson_version_id bigint)
returns public.lesson_versions
language plpgsql security definer set search_path = ''
as $$
declare version_row public.lesson_versions%rowtype; published_version public.lesson_versions%rowtype;
begin
  if not public.can_publish_content() then raise exception 'Publisher or administrator role required'; end if;
  perform public.lock_content_hierarchy_gate();
  select * into version_row from public.lesson_versions where id = requested_lesson_version_id for update;
  if not found then raise exception 'Lesson version does not exist'; end if;
  if version_row.status <> 'draft' then raise exception 'Only a draft lesson version can be published'; end if;
  perform public.validate_lesson_version_listening_audio(version_row.id);
  perform public.validate_lesson_version_pronunciation_blocks(version_row.id);
  perform public.validate_lesson_version_media(version_row.id);
  perform public.validate_lesson_version_ai_missions(version_row.id);
  perform pg_catalog.set_config('pronouncelab.lesson_publication', 'on', true);
  update public.lesson_versions set status = 'published', published_by = auth.uid(), published_at = now()
    where id = version_row.id and status = 'draft' returning * into published_version;
  if not found then raise exception 'Lesson version changed during publication'; end if;
  return published_version;
end;
$$;

revoke all on function public.create_draft_pronunciation_block(bigint, text, text) from public, anon;
grant execute on function public.create_draft_pronunciation_block(bigint, text, text) to authenticated;
revoke all on function public.save_draft_pronunciation_block(bigint, bigint, timestamptz, text, text, text, uuid, jsonb) from public, anon;
grant execute on function public.save_draft_pronunciation_block(bigint, bigint, timestamptz, text, text, text, uuid, jsonb) to authenticated;
revoke all on function public.delete_draft_pronunciation_block(bigint, bigint) from public, anon;
grant execute on function public.delete_draft_pronunciation_block(bigint, bigint) to authenticated;
revoke all on function public.reorder_draft_pronunciation_blocks(bigint, bigint[]) from public, anon;
grant execute on function public.reorder_draft_pronunciation_blocks(bigint, bigint[]) to authenticated;
revoke all on function public.duplicate_draft_lesson_activity(bigint, bigint) from public, anon;
grant execute on function public.duplicate_draft_lesson_activity(bigint, bigint) to authenticated;
revoke all on function public.publish_lesson_version(bigint) from public;
grant execute on function public.publish_lesson_version(bigint) to authenticated;

commit;
