begin;

create or replace function public.publish_course(
  requested_course_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  course_row public.courses%rowtype;
  unit_row public.units%rowtype;
  lesson_row public.lessons%rowtype;
  version_row public.lesson_versions%rowtype;
  activity_row public.lesson_activities%rowtype;
  listening_row public.listening_items%rowtype;
  pronunciation_row public.pronunciation_items%rowtype;
  mission_row public.ai_speaking_missions%rowtype;
  exercise_row public.interactive_practice_exercises%rowtype;
  theory_exists boolean;
  assessment_exists boolean;
  errors jsonb := '[]'::jsonb;
  draft_count integer := 0;
  unchanged_count integer := 0;
  published_count integer := 0;
  archived_count integer := 0;
  selected_version_id bigint;
  media_exists boolean;
begin
  perform public.lock_content_hierarchy_gate();

  select * into strict course_row
  from public.courses
  where id = requested_course_id
  for update;

  if not public.can_publish_course(requested_course_id) then
    raise exception 'Course publication permission is required';
  end if;

  if nullif(pg_catalog.btrim(course_row.title), '') is null then
    errors := errors || jsonb_build_object('courseId', course_row.id, 'courseTitle', course_row.title, 'category', 'course', 'message', 'Course title is required.');
  end if;
  if nullif(pg_catalog.btrim(course_row.slug), '') is null then
    errors := errors || jsonb_build_object('courseId', course_row.id, 'courseTitle', course_row.title, 'category', 'course', 'message', 'Course address is required.');
  end if;

  if not exists (select 1 from public.units where course_id = course_row.id) then
    errors := errors || jsonb_build_object('courseId', course_row.id, 'courseTitle', course_row.title, 'category', 'course', 'message', 'Add at least one unit before publishing the course.');
  end if;

  for unit_row in
    select unit.* from public.units unit where unit.course_id = course_row.id order by unit.position, unit.id for update
  loop
    if nullif(pg_catalog.btrim(unit_row.title), '') is null then
      errors := errors || jsonb_build_object('courseId', course_row.id, 'courseTitle', course_row.title, 'unitId', unit_row.id, 'unitTitle', unit_row.title, 'category', 'unit', 'message', 'Unit title is required.');
    end if;
    if not exists (select 1 from public.lessons where unit_id = unit_row.id) then
      errors := errors || jsonb_build_object('courseId', course_row.id, 'courseTitle', course_row.title, 'unitId', unit_row.id, 'unitTitle', unit_row.title, 'category', 'unit', 'message', 'Add at least one lesson before publishing this unit.');
    end if;

    for lesson_row in
      select lesson.* from public.lessons lesson where lesson.unit_id = unit_row.id order by lesson.position, lesson.id for update
    loop
      if nullif(pg_catalog.btrim(lesson_row.title), '') is null then
        errors := errors || jsonb_build_object('courseId', course_row.id, 'courseTitle', course_row.title, 'unitId', unit_row.id, 'unitTitle', unit_row.title, 'lessonId', lesson_row.id, 'lessonTitle', lesson_row.title, 'category', 'lesson', 'message', 'Lesson title is required.');
      end if;

      select version.id into selected_version_id
      from public.lesson_versions version
      where version.lesson_id = lesson_row.id and version.status = 'draft'
      order by version.version_number desc limit 1;
      if selected_version_id is null then
        selected_version_id := lesson_row.current_published_version_id;
        if selected_version_id is null then
          errors := errors || jsonb_build_object('courseId', course_row.id, 'courseTitle', course_row.title, 'unitId', unit_row.id, 'unitTitle', unit_row.title, 'lessonId', lesson_row.id, 'lessonTitle', lesson_row.title, 'category', 'lesson', 'message', 'Create a lesson draft before publishing this course.');
        else
          unchanged_count := unchanged_count + 1;
        end if;
      else
        draft_count := draft_count + 1;
        if lesson_row.current_published_version_id is not null then
          archived_count := archived_count + 1;
        end if;
      end if;

      if selected_version_id is not null then
        select version.* into version_row from public.lesson_versions version where version.id = selected_version_id;
        if not exists (select 1 from public.lesson_activities activity where activity.lesson_version_id = version_row.id) then
          errors := errors || jsonb_build_object('courseId', course_row.id, 'courseTitle', course_row.title, 'unitId', unit_row.id, 'unitTitle', unit_row.title, 'lessonId', lesson_row.id, 'lessonTitle', lesson_row.title, 'lessonVersionId', version_row.id, 'category', 'lesson', 'message', 'Add at least one activity before publishing this lesson.');
        end if;

        for activity_row in
          select activity.* from public.lesson_activities activity where activity.lesson_version_id = version_row.id order by activity.position, activity.id
        loop
          if nullif(pg_catalog.btrim(activity_row.title), '') is null then
            errors := errors || jsonb_build_object('courseId', course_row.id, 'courseTitle', course_row.title, 'unitId', unit_row.id, 'unitTitle', unit_row.title, 'lessonId', lesson_row.id, 'lessonTitle', lesson_row.title, 'lessonVersionId', version_row.id, 'activityId', activity_row.id, 'activityType', activity_row.type::text, 'category', 'activity', 'message', 'Activity title is required.');
          end if;
          if activity_row.type = 'theory' then
            select exists (select 1 from public.theory_blocks block where block.activity_id = activity_row.id and nullif(pg_catalog.btrim(coalesce(block.text, '')), '') is not null) into theory_exists;
            if not theory_exists then
              errors := errors || jsonb_build_object('courseId', course_row.id, 'courseTitle', course_row.title, 'unitId', unit_row.id, 'unitTitle', unit_row.title, 'lessonId', lesson_row.id, 'lessonTitle', lesson_row.title, 'lessonVersionId', version_row.id, 'activityId', activity_row.id, 'activityType', 'theory', 'category', 'activity', 'message', 'Learning content is required.');
            end if;
          elsif activity_row.type = 'listening' then
            select item.* into listening_row from public.listening_items item where item.activity_id = activity_row.id;
            if not found or listening_row.audio_asset_id is null then
              errors := errors || jsonb_build_object('courseId', course_row.id, 'courseTitle', course_row.title, 'unitId', unit_row.id, 'unitTitle', unit_row.title, 'lessonId', lesson_row.id, 'lessonTitle', lesson_row.title, 'lessonVersionId', version_row.id, 'activityId', activity_row.id, 'activityType', 'listening', 'category', 'activity', 'message', 'Audio file is missing or has not been attached. Save the listening item.');
            else
              select exists (select 1 from public.media_assets asset where asset.id = listening_row.audio_asset_id and asset.kind = 'audio') into media_exists;
              if not media_exists then
                errors := errors || jsonb_build_object('courseId', course_row.id, 'courseTitle', course_row.title, 'unitId', unit_row.id, 'unitTitle', unit_row.title, 'lessonId', lesson_row.id, 'lessonTitle', lesson_row.title, 'lessonVersionId', version_row.id, 'activityId', activity_row.id, 'activityType', 'listening', 'category', 'activity', 'message', 'The attached audio could not be found. Save the listening item again.');
              end if;
            end if;
          elsif activity_row.type = 'pronunciation' then
            select item.* into pronunciation_row from public.pronunciation_items item where item.activity_id = activity_row.id;
            if not found or not public.pronunciation_entries_are_valid(pronunciation_row.block_type, pronunciation_row.entries, true) then
              errors := errors || jsonb_build_object('courseId', course_row.id, 'courseTitle', course_row.title, 'unitId', unit_row.id, 'unitTitle', unit_row.title, 'lessonId', lesson_row.id, 'lessonTitle', lesson_row.title, 'lessonVersionId', version_row.id, 'activityId', activity_row.id, 'activityType', 'pronunciation', 'category', 'activity', 'message', 'Pronunciation content is incomplete.');
            end if;
          elsif activity_row.type = 'ai_speaking_mission' then
            select mission.* into mission_row from public.ai_speaking_missions mission where mission.activity_id = activity_row.id;
            if not found or not public.is_valid_ai_speaking_mission_config(mission_row.config) then
              errors := errors || jsonb_build_object('courseId', course_row.id, 'courseTitle', course_row.title, 'unitId', unit_row.id, 'unitTitle', unit_row.title, 'lessonId', lesson_row.id, 'lessonTitle', lesson_row.title, 'lessonVersionId', version_row.id, 'activityId', activity_row.id, 'activityType', 'ai_speaking_mission', 'category', 'activity', 'message', 'Mission instructions and prompt are required.');
            end if;
          elsif activity_row.type = 'interactive_practice' then
            select exercise.* into exercise_row from public.interactive_practice_exercises exercise where exercise.activity_id = activity_row.id;
            if not found or not public.interactive_practice_is_complete(exercise_row.mode, exercise_row.config) then
              errors := errors || jsonb_build_object('courseId', course_row.id, 'courseTitle', course_row.title, 'unitId', unit_row.id, 'unitTitle', unit_row.title, 'lessonId', lesson_row.id, 'lessonTitle', lesson_row.title, 'lessonVersionId', version_row.id, 'activityId', activity_row.id, 'activityType', 'interactive_practice', 'category', 'activity', 'message', 'Interactive Practice is incomplete.');
            end if;
          elsif activity_row.type in ('practice', 'quiz') then
            select exists (select 1 from public.assessment_sets assessment where assessment.activity_id = activity_row.id) into assessment_exists;
            if not assessment_exists then
              errors := errors || jsonb_build_object('courseId', course_row.id, 'courseTitle', course_row.title, 'unitId', unit_row.id, 'unitTitle', unit_row.title, 'lessonId', lesson_row.id, 'lessonTitle', lesson_row.title, 'lessonVersionId', version_row.id, 'activityId', activity_row.id, 'activityType', activity_row.type::text, 'category', 'activity', 'message', 'Add at least one assessment before publishing this activity.');
            end if;
          end if;
        end loop;

        if version_row.status = 'draft' then
          begin
            perform public.validate_lesson_version_listening_audio(version_row.id);
          exception when others then
            errors := errors || jsonb_build_object('courseId', course_row.id, 'courseTitle', course_row.title, 'unitId', unit_row.id, 'unitTitle', unit_row.title, 'lessonId', lesson_row.id, 'lessonTitle', lesson_row.title, 'lessonVersionId', version_row.id, 'category', 'lesson', 'message', 'Listening content is not ready for publication.');
          end;
          begin
            perform public.validate_lesson_version_pronunciation_blocks(version_row.id);
          exception when others then
            errors := errors || jsonb_build_object('courseId', course_row.id, 'courseTitle', course_row.title, 'unitId', unit_row.id, 'unitTitle', unit_row.title, 'lessonId', lesson_row.id, 'lessonTitle', lesson_row.title, 'lessonVersionId', version_row.id, 'category', 'lesson', 'message', 'Pronunciation content is not ready for publication.');
          end;
          begin
            perform public.validate_lesson_version_media(version_row.id);
          exception when others then
            errors := errors || jsonb_build_object('courseId', course_row.id, 'courseTitle', course_row.title, 'unitId', unit_row.id, 'unitTitle', unit_row.title, 'lessonId', lesson_row.id, 'lessonTitle', lesson_row.title, 'lessonVersionId', version_row.id, 'category', 'lesson', 'message', 'Media references are not ready for publication.');
          end;
          begin
            perform public.validate_lesson_version_ai_missions(version_row.id);
          exception when others then
            errors := errors || jsonb_build_object('courseId', course_row.id, 'courseTitle', course_row.title, 'unitId', unit_row.id, 'unitTitle', unit_row.title, 'lessonId', lesson_row.id, 'lessonTitle', lesson_row.title, 'lessonVersionId', version_row.id, 'category', 'lesson', 'message', 'AI Speaking Mission content is not ready for publication.');
          end;
          begin
            perform public.validate_lesson_version_interactive_practice(version_row.id);
          exception when others then
            errors := errors || jsonb_build_object('courseId', course_row.id, 'courseTitle', course_row.title, 'unitId', unit_row.id, 'unitTitle', unit_row.title, 'lessonId', lesson_row.id, 'lessonTitle', lesson_row.title, 'lessonVersionId', version_row.id, 'category', 'lesson', 'message', 'Interactive Practice is not ready for publication.');
          end;
        end if;
      end if;
      selected_version_id := null;
    end loop;
  end loop;

  if pg_catalog.jsonb_array_length(errors) > 0 then
    return jsonb_build_object('ok', false, 'courseId', course_row.id, 'errors', errors);
  end if;

  for lesson_row in
    select lesson.* from public.lessons lesson join public.units unit on unit.id = lesson.unit_id where unit.course_id = course_row.id order by unit.position, lesson.position, lesson.id
  loop
    select version.* into version_row from public.lesson_versions version where version.lesson_id = lesson_row.id and version.status = 'draft' order by version.version_number desc limit 1;
    if found then
      perform public.publish_lesson_version(version_row.id);
      published_count := published_count + 1;
    end if;
  end loop;

  update public.courses set status = 'published', published_at = coalesce(published_at, pg_catalog.now()), updated_by = auth.uid() where id = course_row.id;
  return jsonb_build_object('ok', true, 'courseId', course_row.id, 'publishedLessons', published_count, 'unchangedLessons', unchanged_count, 'archivedVersions', archived_count, 'publishedAt', pg_catalog.now());
end;
$$;

revoke all on function public.publish_course(bigint) from public, anon;
grant execute on function public.publish_course(bigint) to authenticated;

commit;
