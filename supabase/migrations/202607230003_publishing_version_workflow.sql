begin;

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
  lesson_row public.lessons%rowtype;
  source_version public.lesson_versions%rowtype;
  result public.lesson_versions;
  source_activity public.lesson_activities%rowtype;
  copied_activity public.lesson_activities%rowtype;
  source_set public.assessment_sets%rowtype;
  copied_set public.assessment_sets%rowtype;
  source_question public.questions%rowtype;
  copied_question public.questions%rowtype;
  actor_id uuid := auth.uid();
begin
  perform public.lock_content_hierarchy_gate();

  if not public.can_edit_drafts() or actor_id is null then
    raise exception 'Draft editing permission is required';
  end if;

  select lesson.*
  into strict lesson_row
  from public.lessons lesson
  where lesson.id = requested_lesson_id
    and lesson.unit_id = expected_unit_id
  for update;

  select version.*
  into result
  from public.lesson_versions version
  where version.lesson_id = requested_lesson_id
    and version.status = 'draft'
  order by version.version_number desc
  limit 1
  for update;

  if found then
    return result;
  end if;

  if lesson_row.current_published_version_id is not null then
    select version.*
    into source_version
    from public.lesson_versions version
    where version.id = lesson_row.current_published_version_id
      and version.status = 'published';
  end if;

  if source_version.id is null then
    select version.*
    into source_version
    from public.lesson_versions version
    where version.lesson_id = requested_lesson_id
      and version.status = 'published'
    order by version.version_number desc
    limit 1;
  end if;

  insert into public.lesson_versions (
    lesson_id, version_number, status, created_by
  )
  select requested_lesson_id,
    coalesce(max(version.version_number), 0) + 1,
    'draft', actor_id
  from public.lesson_versions version
  where version.lesson_id = requested_lesson_id
  returning * into result;

  if source_version.id is null then
    return result;
  end if;

  for source_activity in
    select activity.*
    from public.lesson_activities activity
    where activity.lesson_version_id = source_version.id
    order by activity.position, activity.id
  loop
    insert into public.lesson_activities (
      lesson_version_id, type, title, position, required
    ) values (
      result.id, source_activity.type, source_activity.title,
      source_activity.position, source_activity.required
    ) returning * into copied_activity;

    if source_activity.type = 'theory' then
      insert into public.theory_blocks (
        activity_id, block_type, position, heading_level, title, text,
        media_asset_id, alt_text
      )
      select copied_activity.id, block.block_type, block.position,
        block.heading_level, block.title, block.text,
        block.media_asset_id, block.alt_text
      from public.theory_blocks block
      where block.activity_id = source_activity.id;
    elsif source_activity.type = 'listening' then
      insert into public.listening_items (
        activity_id, title, instructions, transcript, audio_asset_id, position
      )
      select copied_activity.id, item.title, item.instructions,
        item.transcript, item.audio_asset_id, item.position
      from public.listening_items item
      where item.activity_id = source_activity.id;
    elsif source_activity.type = 'pronunciation' then
      insert into public.pronunciation_items (
        activity_id, title, instructions, display_text, block_type,
        spelling_pattern, entries, audio_asset_id, position
      )
      select copied_activity.id, item.title, item.instructions,
        item.display_text, item.block_type, item.spelling_pattern,
        item.entries, item.audio_asset_id, item.position
      from public.pronunciation_items item
      where item.activity_id = source_activity.id;
    elsif source_activity.type = 'ai_speaking_mission' then
      insert into public.ai_speaking_missions (activity_id, config)
      select copied_activity.id, mission.config
      from public.ai_speaking_missions mission
      where mission.activity_id = source_activity.id;
    elsif source_activity.type = 'interactive_practice' then
      insert into public.interactive_practice_exercises (
        activity_id, mode, instructions, explanation, config
      )
      select copied_activity.id, exercise.mode, exercise.instructions,
        exercise.explanation, exercise.config
      from public.interactive_practice_exercises exercise
      where exercise.activity_id = source_activity.id;
    elsif source_activity.type in ('practice', 'quiz') then
      for source_set in
        select assessment.*
        from public.assessment_sets assessment
        where assessment.activity_id = source_activity.id
        order by assessment.position, assessment.id
      loop
        insert into public.assessment_sets (
          activity_id, listening_item_id, title, instructions, position
        )
        select copied_activity.id,
          (select copied_item.id
           from public.listening_items source_item
           join public.listening_items copied_item
             on copied_item.activity_id = copied_activity.id
            and copied_item.position = source_item.position
           where source_item.id = source_set.listening_item_id),
          source_set.title, source_set.instructions, source_set.position
        returning * into copied_set;

        for source_question in
          select question.*
          from public.questions question
          where question.assessment_set_id = source_set.id
          order by question.position, question.id
        loop
          insert into public.questions (
            assessment_set_id, prompt, explanation, position, required
          ) values (
            copied_set.id, source_question.prompt, source_question.explanation,
            source_question.position, source_question.required
          ) returning * into copied_question;

          insert into public.question_options (
            question_id, text, position, is_correct
          )
          select copied_question.id, option.text, option.position,
            option.is_correct
          from public.question_options option
          where option.question_id = source_question.id;
        end loop;
      end loop;
    end if;
  end loop;

  return result;
end;
$$;

revoke all on function public.create_lesson_draft_version(bigint, bigint)
  from public, anon;
grant execute on function public.create_lesson_draft_version(bigint, bigint)
  to authenticated;

commit;
