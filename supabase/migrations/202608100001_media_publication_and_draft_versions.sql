begin;

create or replace function public.get_lesson_version_media_publication_plan(
  requested_lesson_version_id bigint
)
returns table (
  media_asset_id uuid,
  activity_type public.lesson_activity_type,
  item_id bigint,
  reference_kind text,
  media_status public.content_status
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_course_id bigint;
begin
  select unit.course_id
  into target_course_id
  from public.lesson_versions version
  join public.lessons lesson on lesson.id = version.lesson_id
  join public.units unit on unit.id = lesson.unit_id
  where version.id = requested_lesson_version_id
    and version.status = 'draft';

  if target_course_id is null then
    raise exception 'Only a draft lesson version can be published';
  end if;
  if not public.can_publish_course(target_course_id) then
    raise exception 'Course publication permission is required';
  end if;

  return query
  select distinct plan.media_asset_id, plan.activity_type,
    plan.item_id, plan.reference_kind, asset.status
  from (
    select block.media_asset_id, activity.type as activity_type,
      block.id as item_id,
      case block.block_type when 'audio' then 'Learn audio' else 'Learn image' end as reference_kind
    from public.lesson_activities activity
    join public.theory_blocks block on block.activity_id = activity.id
    where activity.lesson_version_id = requested_lesson_version_id
      and block.media_asset_id is not null
    union all
    select item.audio_asset_id, activity.type, item.id, 'Listening audio'
    from public.lesson_activities activity
    join public.listening_items item on item.activity_id = activity.id
    where activity.lesson_version_id = requested_lesson_version_id
      and item.audio_asset_id is not null
    union all
    select item.audio_asset_id, activity.type, item.id, 'Pronunciation audio'
    from public.lesson_activities activity
    join public.pronunciation_items item on item.activity_id = activity.id
    where activity.lesson_version_id = requested_lesson_version_id
      and item.audio_asset_id is not null
  ) plan
  join public.media_assets asset on asset.id = plan.media_asset_id
  order by plan.media_asset_id, plan.reference_kind, plan.item_id;
end;
$$;

revoke all on function public.get_lesson_version_media_publication_plan(bigint)
  from public, anon;
grant execute on function public.get_lesson_version_media_publication_plan(bigint)
  to authenticated;

create or replace function public.get_course_media_publication_plan(
  requested_course_id bigint
)
returns table (
  media_asset_id uuid,
  activity_type public.lesson_activity_type,
  item_id bigint,
  reference_kind text,
  media_status public.content_status
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.can_publish_course(requested_course_id) then
    raise exception 'Course publication permission is required';
  end if;

  return query
  with selected_versions as (
    select coalesce(
      (
        select draft.id
        from public.lesson_versions draft
        where draft.lesson_id = lesson.id and draft.status = 'draft'
        order by draft.version_number desc, draft.id desc limit 1
      ),
      lesson.current_published_version_id
    ) as id
    from public.units unit
    join public.lessons lesson on lesson.unit_id = unit.id
    where unit.course_id = requested_course_id
  )
  select distinct plan.media_asset_id, plan.activity_type,
    plan.item_id, plan.reference_kind, asset.status
  from (
    select block.media_asset_id, activity.type as activity_type,
      block.id as item_id,
      case block.block_type when 'audio' then 'Learn audio' else 'Learn image' end as reference_kind
    from selected_versions version
    join public.lesson_activities activity on activity.lesson_version_id = version.id
    join public.theory_blocks block on block.activity_id = activity.id
    where block.media_asset_id is not null
    union all
    select item.audio_asset_id, activity.type, item.id, 'Listening audio'
    from selected_versions version
    join public.lesson_activities activity on activity.lesson_version_id = version.id
    join public.listening_items item on item.activity_id = activity.id
    where item.audio_asset_id is not null
    union all
    select item.audio_asset_id, activity.type, item.id, 'Pronunciation audio'
    from selected_versions version
    join public.lesson_activities activity on activity.lesson_version_id = version.id
    join public.pronunciation_items item on item.activity_id = activity.id
    where item.audio_asset_id is not null
  ) plan
  join public.media_assets asset on asset.id = plan.media_asset_id
  order by plan.media_asset_id, plan.reference_kind, plan.item_id;
end;
$$;

revoke all on function public.get_course_media_publication_plan(bigint)
  from public, anon;
grant execute on function public.get_course_media_publication_plan(bigint)
  to authenticated;

create or replace function public.create_lesson_draft_version(
  requested_lesson_id bigint,
  expected_unit_id bigint
)
returns public.lesson_versions
language plpgsql
security definer
set search_path = ''
as $$
declare
  active_published_version_id bigint;
  source_version public.lesson_versions%rowtype;
  result public.lesson_versions;
  source_activity public.lesson_activities%rowtype;
  copied_activity public.lesson_activities%rowtype;
  source_set public.assessment_sets%rowtype;
  copied_set public.assessment_sets%rowtype;
  source_question public.questions%rowtype;
  copied_question public.questions%rowtype;
  target_course_id bigint;
  actor_id uuid := auth.uid();
begin
  perform public.lock_content_hierarchy_gate();

  select lesson.current_published_version_id, unit.course_id
  into active_published_version_id, target_course_id
  from public.lessons lesson
  join public.units unit on unit.id = lesson.unit_id
  where lesson.id = requested_lesson_id
    and lesson.unit_id = expected_unit_id
  for update of lesson, unit;

  if not found then
    raise exception 'Lesson does not exist in the expected unit';
  end if;
  if actor_id is null or not public.can_edit_course(target_course_id) then
    raise exception 'Course owner or administrator permission is required';
  end if;

  select version.* into result
  from public.lesson_versions version
  where version.lesson_id = requested_lesson_id and version.status = 'draft'
  order by version.version_number desc limit 1 for update;
  if found then return result; end if;

  if active_published_version_id is not null then
    select version.* into source_version
    from public.lesson_versions version
    where version.id = active_published_version_id
      and version.lesson_id = requested_lesson_id
      and version.status = 'published';
  end if;
  if active_published_version_id is not null
    and source_version.id is null then
    raise exception 'The active published lesson version is invalid';
  end if;

  insert into public.lesson_versions (lesson_id, version_number, status, created_by)
  select requested_lesson_id, coalesce(max(version.version_number), 0) + 1,
    'draft', actor_id
  from public.lesson_versions version where version.lesson_id = requested_lesson_id
  returning * into result;

  if source_version.id is null then return result; end if;

  for source_activity in
    select * from public.lesson_activities
    where lesson_version_id = source_version.id order by position, id
  loop
    insert into public.lesson_activities (lesson_version_id, type, title, position, required)
    values (result.id, source_activity.type, source_activity.title,
      source_activity.position, source_activity.required)
    returning * into copied_activity;

    insert into public.theory_blocks (activity_id, block_type, position, heading_level, title, text, media_asset_id, alt_text)
    select copied_activity.id, block_type, position, heading_level, title, text, media_asset_id, alt_text
    from public.theory_blocks where activity_id = source_activity.id;
    insert into public.listening_items (activity_id, title, instructions, transcript, audio_asset_id, position)
    select copied_activity.id, title, instructions, transcript, audio_asset_id, position
    from public.listening_items where activity_id = source_activity.id;
    insert into public.pronunciation_items (activity_id, title, instructions, display_text, block_type, spelling_pattern, entries, audio_asset_id, position)
    select copied_activity.id, title, instructions, display_text, block_type, spelling_pattern, entries, audio_asset_id, position
    from public.pronunciation_items where activity_id = source_activity.id;
    insert into public.ai_speaking_missions (activity_id, config)
    select copied_activity.id, config from public.ai_speaking_missions
    where activity_id = source_activity.id;
    insert into public.interactive_practice_exercises (activity_id, mode, instructions, explanation, config)
    select copied_activity.id, mode, instructions, explanation, config
    from public.interactive_practice_exercises where activity_id = source_activity.id;

    for source_set in
      select * from public.assessment_sets
      where activity_id = source_activity.id order by position, id
    loop
      insert into public.assessment_sets (activity_id, listening_item_id, title, instructions, position)
      values (
        copied_activity.id,
        (select copied_item.id
         from public.listening_items source_item
         join public.listening_items copied_item
           on copied_item.activity_id = copied_activity.id
          and copied_item.position = source_item.position
         where source_item.id = source_set.listening_item_id),
        source_set.title, source_set.instructions, source_set.position
      ) returning * into copied_set;

      for source_question in
        select * from public.questions where assessment_set_id = source_set.id
        order by position, id
      loop
        insert into public.questions (assessment_set_id, prompt, explanation, position, required)
        values (copied_set.id, source_question.prompt, source_question.explanation,
          source_question.position, source_question.required)
        returning * into copied_question;
        insert into public.question_options (question_id, text, position, is_correct)
        select copied_question.id, text, position, is_correct
        from public.question_options where question_id = source_question.id;
      end loop;
    end loop;
  end loop;

  return result;
end;
$$;

revoke all on function public.create_lesson_draft_version(bigint, bigint)
  from public, anon;
grant execute on function public.create_lesson_draft_version(bigint, bigint)
  to authenticated;

commit;
