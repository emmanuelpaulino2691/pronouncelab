begin;

create or replace function public.is_valid_ai_speaking_mission_config(
  requested_config jsonb
)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  required_keys constant text[] := array[
    'missionTitle',
    'missionLabel',
    'cefrLevel',
    'goal',
    'estimatedMinutes',
    'primarySoundLabel',
    'primarySoundIpa',
    'secondarySoundLabel',
    'secondarySoundIpa',
    'primaryWords',
    'secondaryWords',
    'sentences',
    'readingText',
    'supportedTools',
    'promptLanguage',
    'feedbackLanguage',
    'difficultyLabel',
    'resultFormatVersion',
    'teacherInstructions',
    'studentInstructions'
  ];
  string_keys constant text[] := array[
    'missionTitle',
    'missionLabel',
    'cefrLevel',
    'goal',
    'primarySoundLabel',
    'primarySoundIpa',
    'secondarySoundLabel',
    'secondarySoundIpa',
    'readingText',
    'promptLanguage',
    'feedbackLanguage',
    'difficultyLabel',
    'teacherInstructions',
    'studentInstructions'
  ];
  key_name text;
  item jsonb;
  estimated_minutes integer;
  result_version integer;
begin
  if requested_config is null
    or pg_catalog.jsonb_typeof(requested_config) <> 'object'
    or not (requested_config ?& required_keys)
    or pg_catalog.octet_length(requested_config::text) > 50000
  then
    return false;
  end if;

  foreach key_name in array string_keys
  loop
    if pg_catalog.jsonb_typeof(
      requested_config -> key_name
    ) <> 'string'
    then
      return false;
    end if;
  end loop;

  if pg_catalog.btrim(
      requested_config ->> 'missionTitle'
    ) = ''
    or pg_catalog.char_length(
      requested_config ->> 'missionTitle'
    ) > 200
    or pg_catalog.btrim(
      requested_config ->> 'goal'
    ) = ''
    or pg_catalog.char_length(
      requested_config ->> 'goal'
    ) > 2000
    or pg_catalog.btrim(
      requested_config ->> 'primarySoundLabel'
    ) = ''
    or pg_catalog.char_length(
      requested_config ->> 'primarySoundLabel'
    ) > 200
    or pg_catalog.btrim(
      requested_config ->> 'primarySoundIpa'
    ) = ''
    or pg_catalog.char_length(
      requested_config ->> 'primarySoundIpa'
    ) > 200
    or pg_catalog.btrim(
      requested_config ->> 'readingText'
    ) = ''
    or pg_catalog.char_length(
      requested_config ->> 'readingText'
    ) > 3000
    or pg_catalog.btrim(
      requested_config ->> 'promptLanguage'
    ) = ''
    or pg_catalog.char_length(
      requested_config ->> 'promptLanguage'
    ) > 100
    or pg_catalog.btrim(
      requested_config ->> 'feedbackLanguage'
    ) = ''
    or pg_catalog.char_length(
      requested_config ->> 'feedbackLanguage'
    ) > 100
    or pg_catalog.char_length(
      requested_config ->> 'missionLabel'
    ) > 100
    or pg_catalog.char_length(
      requested_config ->> 'secondarySoundLabel'
    ) > 200
    or pg_catalog.char_length(
      requested_config ->> 'secondarySoundIpa'
    ) > 200
    or pg_catalog.char_length(
      requested_config ->> 'difficultyLabel'
    ) > 100
    or pg_catalog.char_length(
      requested_config ->> 'teacherInstructions'
    ) > 5000
    or pg_catalog.char_length(
      requested_config ->> 'studentInstructions'
    ) > 5000
    or requested_config ->> 'cefrLevel'
      not in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')
  then
    return false;
  end if;

  if pg_catalog.jsonb_typeof(
      requested_config -> 'estimatedMinutes'
    ) <> 'number'
    or requested_config ->> 'estimatedMinutes'
      !~ '^[0-9]+$'
    or pg_catalog.jsonb_typeof(
      requested_config -> 'resultFormatVersion'
    ) <> 'number'
    or requested_config ->> 'resultFormatVersion'
      !~ '^[0-9]+$'
  then
    return false;
  end if;

  estimated_minutes :=
    (requested_config ->> 'estimatedMinutes')::integer;
  result_version :=
    (requested_config ->> 'resultFormatVersion')::integer;

  if estimated_minutes < 1
    or estimated_minutes > 60
    or result_version <> 1
  then
    return false;
  end if;

  foreach key_name in array array[
    'primaryWords',
    'secondaryWords',
    'sentences',
    'supportedTools'
  ]
  loop
    if pg_catalog.jsonb_typeof(
      requested_config -> key_name
    ) <> 'array'
    then
      return false;
    end if;

    for item in
      select value
      from pg_catalog.jsonb_array_elements(
        requested_config -> key_name
      )
    loop
      if pg_catalog.jsonb_typeof(item) <> 'string'
        or pg_catalog.btrim(item #>> '{}') = ''
      then
        return false;
      end if;
    end loop;
  end loop;

  if pg_catalog.jsonb_array_length(
      requested_config -> 'primaryWords'
    ) not between 1 and 50
    or pg_catalog.jsonb_array_length(
      requested_config -> 'secondaryWords'
    ) > 50
    or pg_catalog.jsonb_array_length(
      requested_config -> 'sentences'
    ) not between 1 and 20
    or pg_catalog.jsonb_array_length(
      requested_config -> 'supportedTools'
    ) not between 1 and 2
    or exists (
      select 1
      from pg_catalog.jsonb_array_elements_text(
        requested_config -> 'supportedTools'
      ) as tool(value)
      where tool.value not in ('ChatGPT', 'Gemini')
    )
    or (
      select pg_catalog.count(*)
      from pg_catalog.jsonb_array_elements_text(
        requested_config -> 'supportedTools'
      ) as tool(value)
    ) <> (
      select pg_catalog.count(distinct tool.value)
      from pg_catalog.jsonb_array_elements_text(
        requested_config -> 'supportedTools'
      ) as tool(value)
    )
  then
    return false;
  end if;

  if pg_catalog.jsonb_array_length(
      requested_config -> 'secondaryWords'
    ) > 0
    and (
      pg_catalog.btrim(
        requested_config ->> 'secondarySoundLabel'
      ) = ''
      or pg_catalog.btrim(
        requested_config ->> 'secondarySoundIpa'
      ) = ''
    )
  then
    return false;
  end if;

  return true;
exception
  when others then
    return false;
end;
$$;

revoke all on function
  public.is_valid_ai_speaking_mission_config(jsonb)
  from public;

do $$
begin
  if exists (
    select 1
    from public.ai_speaking_missions as mission
    where not public.is_valid_ai_speaking_mission_config(
      mission.config
    )
  )
  then
    raise exception
      'Cannot harden AI speaking missions: invalid configurations exist';
  end if;

  if exists (
    select 1
    from public.lesson_activities as activity
    left join public.ai_speaking_missions as mission
      on mission.activity_id = activity.id
    where activity.type = 'ai_speaking_mission'
      and mission.id is null
  )
  then
    raise exception
      'Cannot harden AI speaking missions: activities without configurations exist';
  end if;
end;
$$;

alter table public.ai_speaking_missions
  drop constraint ai_speaking_missions_required_shape,
  drop constraint ai_speaking_missions_format_version,
  add constraint ai_speaking_missions_complete_config
    check (
      public.is_valid_ai_speaking_mission_config(config)
    );

create or replace function public.protect_ai_activity_creation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.type = 'ai_speaking_mission'
    and coalesce(
      pg_catalog.current_setting(
        'pronouncelab.ai_mission_creation',
        true
      ),
      ''
    ) <> 'on'
  then
    raise exception
      'AI speaking missions must be created through the dedicated RPC';
  end if;

  return new;
end;
$$;

revoke all on function
  public.protect_ai_activity_creation()
  from public;

drop trigger if exists
  lesson_activities_protect_ai_creation
  on public.lesson_activities;
create trigger lesson_activities_protect_ai_creation
before insert on public.lesson_activities
for each row
execute function public.protect_ai_activity_creation();

-- All activity creation is already exposed through draft-authoring RPCs.
-- Removing direct INSERT prevents callers from setting the transaction-local
-- creation marker themselves and bypassing atomic AI mission creation.
revoke insert
  on public.lesson_activities
  from authenticated;

create or replace function public.create_draft_ai_speaking_mission(
  requested_lesson_version_id bigint,
  requested_title text,
  requested_config jsonb
)
returns public.lesson_activities
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.lesson_activities;
  next_position integer;
  clean_title text := pg_catalog.btrim(requested_title);
begin
  perform public.lock_content_hierarchy_gate();

  if not public.can_edit_drafts() then
    raise exception 'Draft editing permission is required';
  end if;
  if clean_title is null or clean_title = '' then
    raise exception 'Activity title is required';
  end if;
  if not public.is_valid_ai_speaking_mission_config(
    requested_config
  )
  then
    raise exception
      'A complete Format Version 1 mission configuration is required';
  end if;

  perform 1
  from public.lesson_versions as version
  join public.lessons as lesson
    on lesson.id = version.lesson_id
  join public.units as unit
    on unit.id = lesson.unit_id
  join public.courses as course
    on course.id = unit.course_id
  where version.id = requested_lesson_version_id
    and version.status = 'draft'
    and lesson.status = 'draft'
    and unit.status = 'draft'
    and course.status = 'draft'
  for update of version, lesson, unit, course;

  if not found then
    raise exception
      'The expected draft lesson version is unavailable';
  end if;

  perform 1
  from public.lesson_activities as activity
  where activity.lesson_version_id =
    requested_lesson_version_id
  order by activity.id
  for update;

  select coalesce(max(activity.position), -1) + 1
  into next_position
  from public.lesson_activities as activity
  where activity.lesson_version_id =
    requested_lesson_version_id;

  perform pg_catalog.set_config(
    'pronouncelab.ai_mission_creation',
    'on',
    true
  );

  insert into public.lesson_activities (
    lesson_version_id,
    type,
    title,
    position,
    required
  )
  values (
    requested_lesson_version_id,
    'ai_speaking_mission',
    clean_title,
    next_position,
    true
  )
  returning * into result;

  insert into public.ai_speaking_missions (
    activity_id,
    config
  )
  values (
    result.id,
    requested_config
  );

  perform pg_catalog.set_config(
    'pronouncelab.ai_mission_creation',
    'off',
    true
  );

  return result;
end;
$$;

revoke all on function
  public.create_draft_ai_speaking_mission(
    bigint,
    text,
    jsonb
  )
  from public, anon;
grant execute on function
  public.create_draft_ai_speaking_mission(
    bigint,
    text,
    jsonb
  )
  to authenticated;

create or replace function public.duplicate_draft_ai_speaking_mission(
  requested_activity_id bigint,
  expected_lesson_version_id bigint
)
returns public.lesson_activities
language plpgsql
security definer
set search_path = ''
as $$
declare
  source_activity public.lesson_activities%rowtype;
  source_config jsonb;
  result public.lesson_activities;
  next_position integer;
begin
  perform public.lock_content_hierarchy_gate();

  if not public.can_edit_drafts() then
    raise exception 'Draft editing permission is required';
  end if;

  select activity.*
  into source_activity
  from public.lesson_activities as activity
  join public.ai_speaking_missions as mission
    on mission.activity_id = activity.id
  join public.lesson_versions as version
    on version.id = activity.lesson_version_id
  join public.lessons as lesson
    on lesson.id = version.lesson_id
  join public.units as unit
    on unit.id = lesson.unit_id
  join public.courses as course
    on course.id = unit.course_id
  where activity.id = requested_activity_id
    and activity.lesson_version_id =
      expected_lesson_version_id
    and activity.type = 'ai_speaking_mission'
    and version.status = 'draft'
    and lesson.status = 'draft'
    and unit.status = 'draft'
    and course.status = 'draft'
  for update of
    activity,
    mission,
    version,
    lesson,
    unit,
    course;

  if not found then
    raise exception
      'The expected draft AI speaking mission is unavailable';
  end if;

  select mission.config
  into source_config
  from public.ai_speaking_missions as mission
  where mission.activity_id = requested_activity_id
  for update;

  perform 1
  from public.lesson_activities as activity
  where activity.lesson_version_id =
    expected_lesson_version_id
  order by activity.id
  for update;

  select coalesce(max(activity.position), -1) + 1
  into next_position
  from public.lesson_activities as activity
  where activity.lesson_version_id =
    expected_lesson_version_id;

  perform pg_catalog.set_config(
    'pronouncelab.ai_mission_creation',
    'on',
    true
  );

  insert into public.lesson_activities (
    lesson_version_id,
    type,
    title,
    position,
    required
  )
  values (
    expected_lesson_version_id,
    'ai_speaking_mission',
    source_activity.title || ' copy',
    next_position,
    source_activity.required
  )
  returning * into result;

  insert into public.ai_speaking_missions (
    activity_id,
    config
  )
  values (
    result.id,
    source_config
  );

  perform pg_catalog.set_config(
    'pronouncelab.ai_mission_creation',
    'off',
    true
  );

  return result;
end;
$$;

revoke all on function
  public.duplicate_draft_ai_speaking_mission(
    bigint,
    bigint
  )
  from public, anon;
grant execute on function
  public.duplicate_draft_ai_speaking_mission(
    bigint,
    bigint
  )
  to authenticated;

revoke insert, update, delete
  on public.ai_speaking_missions
  from authenticated;

create or replace function public.set_ai_mission_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.clock_timestamp();
  return new;
end;
$$;

revoke all on function
  public.set_ai_mission_updated_at()
  from public;

drop trigger if exists
  ai_speaking_missions_set_updated_at
  on public.ai_speaking_missions;
create trigger ai_speaking_missions_set_updated_at
before update on public.ai_speaking_missions
for each row
execute function public.set_ai_mission_updated_at();

create or replace function public.save_draft_ai_speaking_mission(
  requested_mission_id bigint,
  expected_activity_id bigint,
  expected_updated_at timestamptz,
  requested_config jsonb
)
returns public.ai_speaking_missions
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_mission public.ai_speaking_missions%rowtype;
  saved_mission public.ai_speaking_missions%rowtype;
begin
  perform public.lock_content_hierarchy_gate();

  if not public.can_edit_drafts() then
    raise exception 'Draft editing permission is required';
  end if;

  if not public.is_valid_ai_speaking_mission_config(
    requested_config
  )
  then
    raise exception
      'A complete Format Version 1 mission configuration is required';
  end if;

  select mission.*
  into current_mission
  from public.ai_speaking_missions as mission
  join public.lesson_activities as activity
    on activity.id = mission.activity_id
  join public.lesson_versions as version
    on version.id = activity.lesson_version_id
  join public.lessons as lesson
    on lesson.id = version.lesson_id
  join public.units as unit
    on unit.id = lesson.unit_id
  join public.courses as course
    on course.id = unit.course_id
  where mission.id = requested_mission_id
    and mission.activity_id = expected_activity_id
    and activity.type = 'ai_speaking_mission'
    and version.status = 'draft'
    and lesson.status = 'draft'
    and unit.status = 'draft'
    and course.status = 'draft'
  for update of
    mission,
    activity,
    version,
    lesson,
    unit,
    course;

  if not found then
    raise exception
      'The expected draft AI speaking mission is unavailable';
  end if;

  if current_mission.updated_at is distinct from
    expected_updated_at
  then
    raise exception using
      errcode = '40001',
      message =
        'AI speaking mission changed in another editor';
  end if;

  update public.ai_speaking_missions
  set config = requested_config
  where id = current_mission.id
    and activity_id = current_mission.activity_id
    and updated_at = current_mission.updated_at
  returning * into saved_mission;

  if not found then
    raise exception using
      errcode = '40001',
      message =
        'AI speaking mission changed during save';
  end if;

  return saved_mission;
end;
$$;

revoke all on function
  public.save_draft_ai_speaking_mission(
    bigint,
    bigint,
    timestamptz,
    jsonb
  )
  from public, anon;
grant execute on function
  public.save_draft_ai_speaking_mission(
    bigint,
    bigint,
    timestamptz,
    jsonb
  )
  to authenticated;

create or replace function public.validate_lesson_version_ai_missions(
  requested_lesson_version_id bigint
)
returns void
language plpgsql
set search_path = ''
as $$
declare
  invalid_activity_id bigint;
begin
  perform public.lock_content_hierarchy_gate();

  perform 1
  from public.lesson_activities as activity
  where activity.lesson_version_id =
    requested_lesson_version_id
  order by activity.id
  for update;

  perform 1
  from public.ai_speaking_missions as mission
  join public.lesson_activities as activity
    on activity.id = mission.activity_id
  where activity.lesson_version_id =
    requested_lesson_version_id
  order by mission.id
  for update of mission;

  select activity.id
  into invalid_activity_id
  from public.lesson_activities as activity
  left join public.ai_speaking_missions as mission
    on mission.activity_id = activity.id
  where activity.lesson_version_id =
      requested_lesson_version_id
    and activity.type = 'ai_speaking_mission'
  group by activity.id
  having pg_catalog.count(mission.id) <> 1
    or not pg_catalog.bool_and(
      public.is_valid_ai_speaking_mission_config(
        mission.config
      )
    )
  order by activity.id
  limit 1;

  if found then
    raise exception
      'Invalid publication content: AI speaking mission % is incomplete',
      invalid_activity_id;
  end if;
end;
$$;

revoke all on function
  public.validate_lesson_version_ai_missions(bigint)
  from public;

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
begin
  if not public.can_publish_content() then
    raise exception
      'Publisher or administrator role required';
  end if;

  perform public.lock_content_hierarchy_gate();

  select *
  into version_row
  from public.lesson_versions
  where id = requested_lesson_version_id
  for update;

  if not found then
    raise exception 'Lesson version does not exist';
  end if;

  if version_row.status <> 'draft' then
    raise exception
      'Only a draft lesson version can be published';
  end if;

  perform public.validate_lesson_version_media(
    version_row.id
  );
  perform public.validate_lesson_version_ai_missions(
    version_row.id
  );

  perform pg_catalog.set_config(
    'pronouncelab.lesson_publication',
    'on',
    true
  );

  update public.lesson_versions
  set status = 'published',
    published_by = auth.uid(),
    published_at = now()
  where id = version_row.id
    and status = 'draft'
  returning * into published_version;

  if not found then
    raise exception
      'Lesson version changed during publication';
  end if;

  return published_version;
end;
$$;

revoke all on function
  public.publish_lesson_version(bigint)
  from public;
grant execute on function
  public.publish_lesson_version(bigint)
  to authenticated;

commit;
