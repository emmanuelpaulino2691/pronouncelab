begin;

create or replace function public.learner_public_media_projection(
  requested_media_id uuid
)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select pg_catalog.jsonb_build_object(
    'id', media.id::text,
    'kind', media.kind::text,
    'publicPath',
      media.bucket || '/' || media.object_path,
    'mimeType', media.mime_type,
    'altText', media.alt_text
  )
  from public.media_assets as media
  where media.id = requested_media_id
    and media.status = 'published'
    and (
      (
        media.kind = 'audio'
        and media.bucket = 'content-audio'
      )
      or (
        media.kind = 'image'
        and media.bucket = 'content-images'
      )
    );
$$;

revoke all on function
  public.learner_public_media_projection(uuid)
  from public, anon, authenticated, service_role;

create or replace function public.learner_safe_questions_projection(
  requested_assessment_set_id bigint
)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select coalesce(
    pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object(
        'id', question.id::text,
        'prompt', question.prompt,
        'position', question.position,
        'required', question.required,
        'options', (
          select coalesce(
            pg_catalog.jsonb_agg(
              pg_catalog.jsonb_build_object(
                'id', option.id::text,
                'text', option.text,
                'position', option.position
              )
              order by option.position, option.id
            ),
            '[]'::jsonb
          )
          from public.question_options as option
          where option.question_id = question.id
        )
      )
      order by question.position, question.id
    ),
    '[]'::jsonb
  )
  from public.questions as question
  where question.assessment_set_id =
    requested_assessment_set_id;
$$;

revoke all on function
  public.learner_safe_questions_projection(bigint)
  from public, anon, authenticated, service_role;

create or replace function public.learner_published_activity_projection(
  requested_activity_id bigint
)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select pg_catalog.jsonb_build_object(
    'id', activity.id::text,
    'title', activity.title,
    'position', activity.position,
    'required', activity.required,
    'type', activity.type::text
  ) ||
  case activity.type
    when 'theory' then
      pg_catalog.jsonb_build_object(
        'blocks', (
          select coalesce(
            pg_catalog.jsonb_agg(
              case block.block_type
                when 'heading' then
                  pg_catalog.jsonb_build_object(
                    'type', 'heading',
                    'level', block.heading_level,
                    'text', coalesce(block.text, '')
                  )
                when 'paragraph' then
                  pg_catalog.jsonb_build_object(
                    'type', 'paragraph',
                    'text', coalesce(block.text, '')
                  )
                when 'tip' then
                  pg_catalog.jsonb_build_object(
                    'type', 'tip',
                    'text', coalesce(block.text, '')
                  )
                when 'example' then
                  pg_catalog.jsonb_build_object(
                    'type', 'example',
                    'title', coalesce(block.title, ''),
                    'text', coalesce(block.text, '')
                  )
                when 'image' then
                  pg_catalog.jsonb_build_object(
                    'type', 'image',
                    'media',
                      public.learner_public_media_projection(
                        block.media_asset_id
                      ),
                    'alt', coalesce(block.alt_text, '')
                  )
                when 'audio' then
                  pg_catalog.jsonb_build_object(
                    'type', 'audio',
                    'media',
                      public.learner_public_media_projection(
                        block.media_asset_id
                      )
                  )
              end
              order by block.position, block.id
            ),
            '[]'::jsonb
          )
          from public.theory_blocks as block
          where block.activity_id = activity.id
        )
      )
    when 'listening' then
      pg_catalog.jsonb_build_object(
        'items', (
          select coalesce(
            pg_catalog.jsonb_agg(
              pg_catalog.jsonb_build_object(
                'id', item.id::text,
                'title', item.title,
                'position', item.position,
                'instructions', item.instructions,
                'transcript', item.transcript,
                'audio',
                  public.learner_public_media_projection(
                    item.audio_asset_id
                  ),
                'questions', (
                  select coalesce(
                    pg_catalog.jsonb_agg(
                      question_row.value
                      order by
                        question_row.assessment_position,
                        question_row.assessment_id,
                        question_row.question_position
                    )
                      filter (
                        where question_row.value is not null
                      ),
                    '[]'::jsonb
                  )
                  from (
                    select
                      assessment.position as assessment_position,
                      assessment.id as assessment_id,
                      question_element.ordinality as question_position,
                      question_element.value
                    from public.assessment_sets as assessment
                    cross join lateral pg_catalog.jsonb_array_elements(
                      public.learner_safe_questions_projection(
                        assessment.id
                      )
                    ) with ordinality as question_element(value, ordinality)
                    where assessment.activity_id = activity.id
                      and assessment.listening_item_id =
                        item.id
                  ) as question_row
                )
              )
              order by item.position, item.id
            ),
            '[]'::jsonb
          )
          from public.listening_items as item
          where item.activity_id = activity.id
        )
      )
    when 'pronunciation' then
      pg_catalog.jsonb_build_object(
        'items', (
          select coalesce(
            pg_catalog.jsonb_agg(
              pg_catalog.jsonb_build_object(
                'id', item.id::text,
                'title', item.title,
                'position', item.position,
                'instructions', item.instructions,
                'displayText', item.display_text,
                'audio',
                  public.learner_public_media_projection(
                    item.audio_asset_id
                  )
              )
              order by item.position, item.id
            ),
            '[]'::jsonb
          )
          from public.pronunciation_items as item
          where item.activity_id = activity.id
        )
      )
    when 'practice' then
      pg_catalog.jsonb_build_object(
        'items', '[]'::jsonb
      )
    when 'quiz' then
      pg_catalog.jsonb_build_object(
        'assessments', (
          select coalesce(
            pg_catalog.jsonb_agg(
              pg_catalog.jsonb_build_object(
                'id', assessment.id::text,
                'title', assessment.title,
                'position', assessment.position,
                'questions',
                  public.learner_safe_questions_projection(
                    assessment.id
                  )
              )
              order by assessment.position, assessment.id
            ),
            '[]'::jsonb
          )
          from public.assessment_sets as assessment
          where assessment.activity_id = activity.id
            and assessment.listening_item_id is null
        )
      )
    when 'ai_speaking_mission' then
      pg_catalog.jsonb_build_object(
        'missionId', mission.id::text,
        'config', pg_catalog.jsonb_build_object(
          'missionTitle',
            mission.config -> 'missionTitle',
          'missionLabel',
            mission.config -> 'missionLabel',
          'cefrLevel',
            mission.config -> 'cefrLevel',
          'goal',
            mission.config -> 'goal',
          'estimatedMinutes',
            mission.config -> 'estimatedMinutes',
          'primarySoundLabel',
            mission.config -> 'primarySoundLabel',
          'primarySoundIpa',
            mission.config -> 'primarySoundIpa',
          'secondarySoundLabel',
            mission.config -> 'secondarySoundLabel',
          'secondarySoundIpa',
            mission.config -> 'secondarySoundIpa',
          'primaryWords',
            mission.config -> 'primaryWords',
          'secondaryWords',
            mission.config -> 'secondaryWords',
          'sentences',
            mission.config -> 'sentences',
          'readingText',
            mission.config -> 'readingText',
          'supportedTools',
            mission.config -> 'supportedTools',
          'promptLanguage',
            mission.config -> 'promptLanguage',
          'feedbackLanguage',
            mission.config -> 'feedbackLanguage',
          'difficultyLabel',
            mission.config -> 'difficultyLabel',
          'resultFormatVersion',
            mission.config -> 'resultFormatVersion',
          'teacherInstructions',
            mission.config -> 'teacherInstructions',
          'studentInstructions',
            mission.config -> 'studentInstructions'
        )
      )
  end
  from public.lesson_activities as activity
  left join public.ai_speaking_missions as mission
    on mission.activity_id = activity.id
    and activity.type = 'ai_speaking_mission'
  where activity.id = requested_activity_id;
$$;

revoke all on function
  public.learner_published_activity_projection(bigint)
  from public, anon, authenticated, service_role;

create or replace function public.get_published_learning_catalog(
  requested_schema_version integer
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when requested_schema_version is distinct from 1 then
      pg_catalog.jsonb_build_object(
        'error', pg_catalog.jsonb_build_object(
          'code', 'unsupported_schema_version',
          'requestedSchemaVersion',
            requested_schema_version,
          'supportedSchemaVersions',
            pg_catalog.jsonb_build_array(1)
        )
      )
    else
      pg_catalog.jsonb_build_object(
        'schemaVersion', 1,
        'catalogRevision', coalesce(
          (
            select pg_catalog.md5(
              pg_catalog.string_agg(
                lesson.id::text || ':' ||
                version.id::text || ':' ||
                version.version_number::text,
                ',' order by
                  course.position,
                  course.id,
                  unit.position,
                  unit.id,
                  lesson.position,
                  lesson.id
              )
            )
            from public.courses as course
            join public.units as unit
              on unit.course_id = course.id
            join public.lessons as lesson
              on lesson.unit_id = unit.id
            join public.lesson_versions as version
              on version.id =
                lesson.current_published_version_id
              and version.lesson_id = lesson.id
            where course.status = 'published'
              and unit.status = 'published'
              and lesson.status = 'published'
              and version.status = 'published'
          ),
          pg_catalog.md5('')
        ),
        'generatedAt',
          pg_catalog.to_char(
            pg_catalog.statement_timestamp()
              at time zone 'UTC',
            'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'
          ),
        'courses', (
          select coalesce(
            pg_catalog.jsonb_agg(
              pg_catalog.jsonb_build_object(
                'id', course.id::text,
                'slug', course.slug,
                'title', course.title,
                'description', course.description,
                'level', course.level,
                'emoji', course.emoji,
                'position', course.position,
                'units', (
                  select coalesce(
                    pg_catalog.jsonb_agg(
                      pg_catalog.jsonb_build_object(
                        'id', unit.id::text,
                        'courseId', unit.course_id::text,
                        'title', unit.title,
                        'description', unit.description,
                        'position', unit.position,
                        'lessons', (
                          select coalesce(
                            pg_catalog.jsonb_agg(
                              pg_catalog.jsonb_build_object(
                                'id', lesson.id::text,
                                'unitId', lesson.unit_id::text,
                                'title', lesson.title,
                                'description',
                                  lesson.description,
                                'position', lesson.position,
                                'currentVersionId',
                                  version.id::text,
                                'activityCount', (
                                  select pg_catalog.count(*)::integer
                                  from public.lesson_activities
                                    as activity
                                  where activity.lesson_version_id =
                                    version.id
                                )
                              )
                              order by
                                lesson.position,
                                lesson.id
                            ),
                            '[]'::jsonb
                          )
                          from public.lessons as lesson
                          join public.lesson_versions as version
                            on version.id =
                              lesson.current_published_version_id
                            and version.lesson_id = lesson.id
                          where lesson.unit_id = unit.id
                            and lesson.status = 'published'
                            and version.status = 'published'
                        )
                      )
                      order by unit.position, unit.id
                    ),
                    '[]'::jsonb
                  )
                  from public.units as unit
                  where unit.course_id = course.id
                    and unit.status = 'published'
                    and exists (
                      select 1
                      from public.lessons as lesson
                      join public.lesson_versions as version
                        on version.id =
                          lesson.current_published_version_id
                        and version.lesson_id = lesson.id
                      where lesson.unit_id = unit.id
                        and lesson.status = 'published'
                        and version.status = 'published'
                    )
                )
              )
              order by course.position, course.id
            ),
            '[]'::jsonb
          )
          from public.courses as course
          where course.status = 'published'
            and exists (
              select 1
              from public.units as unit
              join public.lessons as lesson
                on lesson.unit_id = unit.id
              join public.lesson_versions as version
                on version.id =
                  lesson.current_published_version_id
                and version.lesson_id = lesson.id
              where unit.course_id = course.id
                and unit.status = 'published'
                and lesson.status = 'published'
                and version.status = 'published'
            )
        )
      )
  end;
$$;

revoke all on function
  public.get_published_learning_catalog(integer)
  from public;
grant execute on function
  public.get_published_learning_catalog(integer)
  to anon, authenticated, service_role;

comment on function
  public.get_published_learning_catalog(integer)
is
  'Returns the ordered learner-safe published catalog projection.';

create or replace function public.get_published_lesson(
  requested_lesson_id bigint,
  requested_schema_version integer
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when requested_schema_version is distinct from 1 then
      pg_catalog.jsonb_build_object(
        'error', pg_catalog.jsonb_build_object(
          'code', 'unsupported_schema_version',
          'requestedSchemaVersion',
            requested_schema_version,
          'supportedSchemaVersions',
            pg_catalog.jsonb_build_array(1)
        )
      )
    else
      coalesce(
        (
          select pg_catalog.jsonb_build_object(
            'schemaVersion', 1,
            'lessonRevision',
              version.id::text || ':' ||
              version.version_number::text,
            'generatedAt',
              pg_catalog.to_char(
                pg_catalog.statement_timestamp()
                  at time zone 'UTC',
                'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'
              ),
            'lesson', pg_catalog.jsonb_build_object(
              'id', lesson.id::text,
              'unitId', lesson.unit_id::text,
              'courseId', unit.course_id::text,
              'title', lesson.title,
              'description', lesson.description,
              'currentVersionId', version.id::text,
              'versionNumber', version.version_number,
              'publishedAt', pg_catalog.to_char(
                version.published_at at time zone 'UTC',
                'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'
              ),
              'activities', (
                select coalesce(
                  pg_catalog.jsonb_agg(
                    public.learner_published_activity_projection(
                      activity.id
                    )
                    order by activity.position, activity.id
                  ),
                  '[]'::jsonb
                )
                from public.lesson_activities as activity
                where activity.lesson_version_id = version.id
              )
            )
          )
          from public.lessons as lesson
          join public.units as unit
            on unit.id = lesson.unit_id
          join public.courses as course
            on course.id = unit.course_id
          join public.lesson_versions as version
            on version.id =
              lesson.current_published_version_id
            and version.lesson_id = lesson.id
          where lesson.id = requested_lesson_id
            and course.status = 'published'
            and unit.status = 'published'
            and lesson.status = 'published'
            and version.status = 'published'
        ),
        pg_catalog.jsonb_build_object(
          'schemaVersion', 1,
          'lessonRevision', 'not-found',
          'generatedAt',
            pg_catalog.to_char(
              pg_catalog.statement_timestamp()
                at time zone 'UTC',
              'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'
            ),
          'lesson', null
        )
      )
  end;
$$;

revoke all on function
  public.get_published_lesson(bigint, integer)
  from public;
grant execute on function
  public.get_published_lesson(bigint, integer)
  to anon, authenticated, service_role;

comment on function
  public.get_published_lesson(bigint, integer)
is
  'Returns one learner-safe current published lesson or a uniform not-found envelope.';

commit;
