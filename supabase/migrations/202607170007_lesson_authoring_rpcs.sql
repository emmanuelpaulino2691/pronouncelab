begin;

create or replace function public.prevent_authoring_reparent()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  parent_index integer;
begin
  for parent_index in 0..tg_nargs - 1 loop
    if pg_catalog.to_jsonb(new)
        -> tg_argv[parent_index]
      is distinct from
      pg_catalog.to_jsonb(old)
        -> tg_argv[parent_index]
    then
      raise exception
        'The %.% parent relationship cannot be changed',
        tg_table_name,
        tg_argv[parent_index];
    end if;
  end loop;

  return new;
end;
$$;

revoke all on function
  public.prevent_authoring_reparent()
  from public;

drop trigger if exists lesson_activities_prevent_reparent
  on public.lesson_activities;
create trigger lesson_activities_prevent_reparent
before update on public.lesson_activities
for each row execute function
  public.prevent_authoring_reparent(
    'lesson_version_id'
  );

drop trigger if exists theory_blocks_prevent_reparent
  on public.theory_blocks;
create trigger theory_blocks_prevent_reparent
before update on public.theory_blocks
for each row execute function
  public.prevent_authoring_reparent('activity_id');

drop trigger if exists listening_items_prevent_reparent
  on public.listening_items;
create trigger listening_items_prevent_reparent
before update on public.listening_items
for each row execute function
  public.prevent_authoring_reparent('activity_id');

drop trigger if exists pronunciation_items_prevent_reparent
  on public.pronunciation_items;
create trigger pronunciation_items_prevent_reparent
before update on public.pronunciation_items
for each row execute function
  public.prevent_authoring_reparent('activity_id');

drop trigger if exists assessment_sets_prevent_reparent
  on public.assessment_sets;
create trigger assessment_sets_prevent_reparent
before update on public.assessment_sets
for each row execute function
  public.prevent_authoring_reparent(
    'activity_id',
    'listening_item_id'
  );

drop trigger if exists questions_prevent_reparent
  on public.questions;
create trigger questions_prevent_reparent
before update on public.questions
for each row execute function
  public.prevent_authoring_reparent(
    'assessment_set_id'
  );

drop trigger if exists question_options_prevent_reparent
  on public.question_options;
create trigger question_options_prevent_reparent
before update on public.question_options
for each row execute function
  public.prevent_authoring_reparent('question_id');

create or replace function
  public.touch_question_after_option_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  parent_question_id bigint;
begin
  parent_question_id := case
    when tg_op = 'DELETE' then old.question_id
    else new.question_id
  end;

  update public.questions
  set updated_at = pg_catalog.clock_timestamp()
  where id = parent_question_id;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function
  public.touch_question_after_option_change()
  from public;

drop trigger if exists
  question_options_touch_question
  on public.question_options;
create trigger question_options_touch_question
after insert or update or delete
on public.question_options
for each row execute function
  public.touch_question_after_option_change();

create or replace function public.is_draft_activity(
  requested_activity_id bigint
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.can_manage_content()
    and exists (
      select 1
      from public.lesson_activities as activity
      join public.lesson_versions as version
        on version.id = activity.lesson_version_id
      join public.lessons as lesson
        on lesson.id = version.lesson_id
      join public.units as unit
        on unit.id = lesson.unit_id
      join public.courses as course
        on course.id = unit.course_id
      where activity.id = requested_activity_id
        and version.status = 'draft'
        and lesson.status = 'draft'
        and unit.status = 'draft'
        and course.status = 'draft'
    );
$$;

drop policy if exists "lesson_activities_insert_draft"
  on public.lesson_activities;
create policy "lesson_activities_insert_draft"
on public.lesson_activities for insert
to authenticated
with check (
  public.can_edit_drafts()
  and exists (
    select 1
    from public.lesson_versions as version
    join public.lessons as lesson
      on lesson.id = version.lesson_id
    join public.units as unit
      on unit.id = lesson.unit_id
    join public.courses as course
      on course.id = unit.course_id
    where version.id = lesson_version_id
      and version.status = 'draft'
      and lesson.status = 'draft'
      and unit.status = 'draft'
      and course.status = 'draft'
  )
);

drop policy if exists "lesson_activities_update_draft"
  on public.lesson_activities;
create policy "lesson_activities_update_draft"
on public.lesson_activities for update
to authenticated
using (
  public.can_edit_drafts()
  and public.is_draft_activity(id)
)
with check (
  public.can_edit_drafts()
  and exists (
    select 1
    from public.lesson_versions as version
    join public.lessons as lesson
      on lesson.id = version.lesson_id
    join public.units as unit
      on unit.id = lesson.unit_id
    join public.courses as course
      on course.id = unit.course_id
    where version.id = lesson_version_id
      and version.status = 'draft'
      and lesson.status = 'draft'
      and unit.status = 'draft'
      and course.status = 'draft'
  )
);

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
  result public.lesson_versions;
  actor_id uuid;
begin
  perform public.lock_content_hierarchy_gate();

  if not public.can_edit_drafts() then
    raise exception 'Draft editing permission is required';
  end if;

  actor_id := auth.uid();
  if actor_id is null then
    raise exception 'An authenticated user is required';
  end if;

  perform 1
  from public.lessons as lesson
  join public.units as unit on unit.id = lesson.unit_id
  join public.courses as course
    on course.id = unit.course_id
  where lesson.id = requested_lesson_id
    and lesson.unit_id = expected_unit_id
    and lesson.status = 'draft'
    and unit.status = 'draft'
    and course.status = 'draft'
  for update of lesson, unit, course;

  if not found then
    raise exception 'The expected draft lesson is unavailable';
  end if;

  select version.*
  into result
  from public.lesson_versions as version
  where version.lesson_id = requested_lesson_id
    and version.status = 'draft'
  order by version.version_number desc
  limit 1
  for update;

  if found then
    return result;
  end if;

  insert into public.lesson_versions (
    lesson_id,
    version_number,
    status,
    created_by
  )
  select
    requested_lesson_id,
    coalesce(max(version.version_number), 0) + 1,
    'draft',
    actor_id
  from public.lesson_versions as version
  where version.lesson_id = requested_lesson_id
  returning * into result;

  return result;
end;
$$;

revoke all on function
  public.create_lesson_draft_version(bigint, bigint)
  from public, anon;
grant execute on function
  public.create_lesson_draft_version(bigint, bigint)
  to authenticated;

create or replace function public.create_draft_lesson_activity(
  requested_lesson_version_id bigint,
  requested_type public.lesson_activity_type,
  requested_title text
)
returns public.lesson_activities
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.lesson_activities;
  clean_title text := btrim(requested_title);
  next_position integer;
begin
  if clean_title is null or clean_title = '' then
    raise exception 'Activity title is required';
  end if;

  perform public.lock_content_hierarchy_gate();

  if not public.can_edit_drafts() then
    raise exception 'Draft editing permission is required';
  end if;

  perform 1
  from public.lesson_versions as version
  join public.lessons as lesson on lesson.id = version.lesson_id
  join public.units as unit on unit.id = lesson.unit_id
  join public.courses as course
    on course.id = unit.course_id
  where version.id = requested_lesson_version_id
    and version.status = 'draft'
    and lesson.status = 'draft'
    and unit.status = 'draft'
    and course.status = 'draft'
  for update of version, lesson, unit, course;
  if not found then
    raise exception 'The expected draft lesson version is unavailable';
  end if;

  perform 1
  from public.lesson_activities as activity
  where activity.lesson_version_id = requested_lesson_version_id
  order by activity.id
  for update;

  select coalesce(max(activity.position), -1) + 1
  into next_position
  from public.lesson_activities as activity
  where activity.lesson_version_id = requested_lesson_version_id;

  insert into public.lesson_activities (
    lesson_version_id, type, title, position, required
  )
  values (
    requested_lesson_version_id,
    requested_type,
    clean_title,
    next_position,
    true
  )
  returning * into result;

  case requested_type
    when 'theory' then
      insert into public.theory_blocks (
        activity_id, block_type, position, text
      ) values (result.id, 'paragraph', 0, '');
    when 'listening' then
      insert into public.listening_items (
        activity_id, title, position
      ) values (result.id, clean_title, 0);
    when 'pronunciation' then
      insert into public.pronunciation_items (
        activity_id, title, display_text, position
      ) values (result.id, clean_title, '', 0);
    when 'quiz' then
      insert into public.assessment_sets (
        activity_id, title, position
      ) values (result.id, clean_title, 0);
    when 'practice' then
      null;
  end case;

  return result;
end;
$$;

revoke all on function
  public.create_draft_lesson_activity(
    bigint, public.lesson_activity_type, text
  )
  from public, anon;
grant execute on function
  public.create_draft_lesson_activity(
    bigint, public.lesson_activity_type, text
  )
  to authenticated;

create or replace function public.reorder_draft_lesson_activities(
  requested_lesson_version_id bigint,
  ordered_activity_ids bigint[]
)
returns setof public.lesson_activities
language plpgsql
security definer
set search_path = ''
as $$
declare
  activity_count integer;
  distinct_count integer;
  temporary_offset integer;
begin
  perform public.lock_content_hierarchy_gate();

  if not public.can_edit_drafts() then
    raise exception 'Draft editing permission is required';
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
    raise exception 'The expected draft lesson version is unavailable';
  end if;

  perform 1
  from public.lesson_activities as activity
  where activity.lesson_version_id = requested_lesson_version_id
  order by activity.id
  for update;

  select count(*), coalesce(max(position), -1) + count(*) + 1
  into activity_count, temporary_offset
  from public.lesson_activities
  where lesson_version_id = requested_lesson_version_id;

  select count(distinct id)
  into distinct_count
  from unnest(ordered_activity_ids) as ids(id)
  where id is not null;

  if cardinality(ordered_activity_ids) <> activity_count
    or distinct_count <> activity_count
    or exists (
      select 1
      from unnest(ordered_activity_ids) as ids(id)
      left join public.lesson_activities as activity
        on activity.id = ids.id
       and activity.lesson_version_id = requested_lesson_version_id
      where activity.id is null
    )
  then
    raise exception 'The activity order does not match the lesson version';
  end if;

  update public.lesson_activities
  set position = position + temporary_offset
  where lesson_version_id = requested_lesson_version_id;

  update public.lesson_activities as activity
  set position = ordered.new_position
  from (
    select id, ordinality::integer - 1 as new_position
    from unnest(ordered_activity_ids) with ordinality as ids(id, ordinality)
  ) as ordered
  where activity.id = ordered.id
    and activity.lesson_version_id = requested_lesson_version_id;

  return query
  select activity.*
  from public.lesson_activities as activity
  where activity.lesson_version_id = requested_lesson_version_id
  order by activity.position;
end;
$$;

revoke all on function
  public.reorder_draft_lesson_activities(bigint, bigint[])
  from public, anon;
grant execute on function
  public.reorder_draft_lesson_activities(bigint, bigint[])
  to authenticated;

create or replace function public.reorder_draft_theory_blocks(
  expected_activity_id bigint,
  ordered_block_ids bigint[]
)
returns setof public.theory_blocks
language plpgsql
security definer
set search_path = ''
as $$
declare
  item_count integer;
  distinct_count integer;
  temporary_offset integer;
begin
  perform public.lock_content_hierarchy_gate();

  if not public.can_edit_drafts() then
    raise exception 'Draft editing permission is required';
  end if;

  perform 1
  from public.lesson_activities as activity
  join public.lesson_versions as version
    on version.id = activity.lesson_version_id
  join public.lessons as lesson
    on lesson.id = version.lesson_id
  join public.units as unit
    on unit.id = lesson.unit_id
  join public.courses as course
    on course.id = unit.course_id
  where activity.id = expected_activity_id
    and activity.type = 'theory'
    and version.status = 'draft'
    and lesson.status = 'draft'
    and unit.status = 'draft'
    and course.status = 'draft'
  for update of
    activity, version, lesson, unit, course;
  if not found then
    raise exception
      'The expected draft theory activity is unavailable';
  end if;

  perform 1
  from public.theory_blocks
  where activity_id = expected_activity_id
  order by id
  for update;

  select count(*), coalesce(max(position), -1) + count(*) + 1
  into item_count, temporary_offset
  from public.theory_blocks
  where activity_id = expected_activity_id;

  select count(distinct id)
  into distinct_count
  from unnest(ordered_block_ids) as ids(id)
  where id is not null;

  if cardinality(ordered_block_ids) <> item_count
    or distinct_count <> item_count
    or exists (
      select 1
      from unnest(ordered_block_ids) as ids(id)
      left join public.theory_blocks as block
        on block.id = ids.id
       and block.activity_id = expected_activity_id
      where block.id is null
    )
  then
    raise exception 'The block order does not match the theory activity';
  end if;

  update public.theory_blocks
  set position = position + temporary_offset
  where activity_id = expected_activity_id;

  update public.theory_blocks as block
  set position = ordered.new_position
  from (
    select id, ordinality::integer - 1 as new_position
    from unnest(ordered_block_ids)
      with ordinality as ids(id, ordinality)
  ) as ordered
  where block.id = ordered.id
    and block.activity_id = expected_activity_id;

  return query
  select block.*
  from public.theory_blocks as block
  where block.activity_id = expected_activity_id
  order by block.position;
end;
$$;

revoke all on function
  public.reorder_draft_theory_blocks(bigint, bigint[])
  from public, anon;
grant execute on function
  public.reorder_draft_theory_blocks(bigint, bigint[])
  to authenticated;

create or replace function public.create_draft_quiz_question(
  expected_assessment_set_id bigint,
  requested_position integer
)
returns public.questions
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.questions;
begin
  if requested_position < 0 then
    raise exception 'Question position must not be negative';
  end if;

  perform public.lock_content_hierarchy_gate();

  if not public.can_edit_drafts() then
    raise exception 'Draft editing permission is required';
  end if;

  perform 1
  from public.assessment_sets as assessment
  join public.lesson_activities as activity
    on activity.id = assessment.activity_id
  join public.lesson_versions as version
    on version.id = activity.lesson_version_id
  join public.lessons as lesson
    on lesson.id = version.lesson_id
  join public.units as unit
    on unit.id = lesson.unit_id
  join public.courses as course
    on course.id = unit.course_id
  where assessment.id = expected_assessment_set_id
    and activity.type = 'quiz'
    and version.status = 'draft'
    and lesson.status = 'draft'
    and unit.status = 'draft'
    and course.status = 'draft'
  for update of
    assessment, activity, version, lesson, unit,
    course;
  if not found then
    raise exception 'The expected draft quiz is unavailable';
  end if;

  perform 1
  from public.questions
  where assessment_set_id = expected_assessment_set_id
  order by id
  for update;

  if exists (
    select 1
    from public.questions
    where assessment_set_id = expected_assessment_set_id
      and position = requested_position
  ) then
    raise exception 'The requested question position is already used';
  end if;

  insert into public.questions (
    assessment_set_id, prompt, position, required
  ) values (
    expected_assessment_set_id,
    'New question',
    requested_position,
    true
  ) returning * into result;

  insert into public.question_options (
    question_id, text, position, is_correct
  ) values
    (result.id, 'Option 1', 0, true),
    (result.id, 'Option 2', 1, false);

  return result;
end;
$$;

revoke all on function
  public.create_draft_quiz_question(bigint, integer)
  from public, anon;
grant execute on function
  public.create_draft_quiz_question(bigint, integer)
  to authenticated;

create or replace function public.save_draft_quiz_question(
  requested_question_id bigint,
  expected_assessment_set_id bigint,
  expected_updated_at timestamptz,
  requested_prompt text,
  requested_explanation text,
  requested_required boolean,
  requested_option_ids bigint[],
  requested_option_texts text[],
  requested_correct_index integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.questions;
  option_count integer := cardinality(requested_option_ids);
  option_index integer;
begin
  if btrim(requested_prompt) = ''
    or option_count < 2
    or cardinality(requested_option_texts) <> option_count
    or requested_correct_index < 0
    or requested_correct_index >= option_count
    or exists (
      select 1
      from unnest(requested_option_texts) as text_value
      where btrim(text_value) = ''
    )
  then
    raise exception 'Question and answer options are invalid';
  end if;

  perform public.lock_content_hierarchy_gate();

  if not public.can_edit_drafts() then
    raise exception 'Draft editing permission is required';
  end if;

  perform 1
  from public.assessment_sets as assessment
  join public.lesson_activities as activity
    on activity.id = assessment.activity_id
  join public.lesson_versions as version
    on version.id = activity.lesson_version_id
  join public.lessons as lesson
    on lesson.id = version.lesson_id
  join public.units as unit
    on unit.id = lesson.unit_id
  join public.courses as course
    on course.id = unit.course_id
  where assessment.id = expected_assessment_set_id
    and activity.type = 'quiz'
    and version.status = 'draft'
    and lesson.status = 'draft'
    and unit.status = 'draft'
    and course.status = 'draft'
  for update of
    assessment, activity, version, lesson, unit,
    course;
  if not found then
    raise exception 'The expected draft quiz is unavailable';
  end if;

  select question.*
  into result
  from public.questions as question
  where question.id = requested_question_id
    and question.assessment_set_id =
      expected_assessment_set_id
  for update;
  if not found then
    raise exception 'The expected question is unavailable';
  end if;
  if result.updated_at is distinct from expected_updated_at
  then
    raise exception
      'Quiz question save conflict: the question changed after it was loaded'
      using errcode = '40001';
  end if;

  perform 1
  from public.question_options
  where question_id = requested_question_id
  order by id
  for update;

  if (
    select count(*) <> option_count
      or count(distinct id) <> option_count
    from unnest(requested_option_ids) as ids(id)
  ) or exists (
    select 1
    from unnest(requested_option_ids) as ids(id)
    left join public.question_options as option
      on option.id = ids.id
     and option.question_id = requested_question_id
    where option.id is null
  ) then
    raise exception 'The answer options do not match the question';
  end if;

  update public.questions
  set prompt = btrim(requested_prompt),
    explanation = nullif(
      btrim(requested_explanation), ''
    ),
    required = requested_required
  where id = requested_question_id
    and assessment_set_id =
      expected_assessment_set_id
  returning * into result;

  update public.question_options
  set is_correct = false
  where question_id = requested_question_id;

  for option_index in 1..option_count loop
    update public.question_options
    set text = btrim(
        requested_option_texts[option_index]
      ),
      is_correct =
        option_index - 1 = requested_correct_index
    where id = requested_option_ids[option_index]
      and question_id = requested_question_id;
  end loop;

  select question.*
  into result
  from public.questions as question
  where question.id = requested_question_id
    and question.assessment_set_id =
      expected_assessment_set_id;

  return pg_catalog.jsonb_build_object(
    'id', result.id,
    'assessment_set_id', result.assessment_set_id,
    'prompt', result.prompt,
    'explanation', result.explanation,
    'position', result.position,
    'required', result.required,
    'updated_at', result.updated_at,
    'options', (
      select coalesce(
        pg_catalog.jsonb_agg(
          pg_catalog.jsonb_build_object(
            'id', option.id,
            'question_id', option.question_id,
            'text', option.text,
            'position', option.position,
            'is_correct', option.is_correct
          )
          order by option.position
        ),
        '[]'::jsonb
      )
      from public.question_options as option
      where option.question_id = result.id
    )
  );
end;
$$;

revoke all on function
  public.save_draft_quiz_question(
    bigint, bigint, timestamptz,
    text, text, boolean,
    bigint[], text[], integer
  )
  from public, anon;
grant execute on function
  public.save_draft_quiz_question(
    bigint, bigint, timestamptz,
    text, text, boolean,
    bigint[], text[], integer
  )
  to authenticated;

create or replace function public.reorder_draft_quiz_questions(
  expected_assessment_set_id bigint,
  ordered_question_ids bigint[]
)
returns setof public.questions
language plpgsql
security definer
set search_path = ''
as $$
declare
  item_count integer;
  distinct_count integer;
  temporary_offset integer;
begin
  perform public.lock_content_hierarchy_gate();

  if not public.can_edit_drafts() then
    raise exception 'Draft editing permission is required';
  end if;

  perform 1
  from public.assessment_sets as assessment
  join public.lesson_activities as activity
    on activity.id = assessment.activity_id
  join public.lesson_versions as version
    on version.id = activity.lesson_version_id
  join public.lessons as lesson
    on lesson.id = version.lesson_id
  join public.units as unit
    on unit.id = lesson.unit_id
  join public.courses as course
    on course.id = unit.course_id
  where assessment.id = expected_assessment_set_id
    and activity.type = 'quiz'
    and version.status = 'draft'
    and lesson.status = 'draft'
    and unit.status = 'draft'
    and course.status = 'draft'
  for update of
    assessment, activity, version, lesson, unit,
    course;
  if not found then
    raise exception 'The expected draft quiz is unavailable';
  end if;

  perform 1
  from public.questions
  where assessment_set_id = expected_assessment_set_id
  order by id
  for update;

  select count(*), coalesce(max(position), -1) + count(*) + 1
  into item_count, temporary_offset
  from public.questions
  where assessment_set_id = expected_assessment_set_id;

  select count(distinct id)
  into distinct_count
  from unnest(ordered_question_ids) as ids(id)
  where id is not null;

  if cardinality(ordered_question_ids) <> item_count
    or distinct_count <> item_count
    or exists (
      select 1
      from unnest(ordered_question_ids) as ids(id)
      left join public.questions as question
        on question.id = ids.id
       and question.assessment_set_id =
         expected_assessment_set_id
      where question.id is null
    )
  then
    raise exception 'The question order does not match the quiz';
  end if;

  update public.questions
  set position = position + temporary_offset
  where assessment_set_id = expected_assessment_set_id;

  update public.questions as question
  set position = ordered.new_position
  from (
    select id, ordinality::integer - 1 as new_position
    from unnest(ordered_question_ids)
      with ordinality as ids(id, ordinality)
  ) as ordered
  where question.id = ordered.id
    and question.assessment_set_id =
      expected_assessment_set_id;

  return query
  select question.*
  from public.questions as question
  where question.assessment_set_id =
    expected_assessment_set_id
  order by question.position;
end;
$$;

revoke all on function
  public.reorder_draft_quiz_questions(bigint, bigint[])
  from public, anon;
grant execute on function
  public.reorder_draft_quiz_questions(bigint, bigint[])
  to authenticated;

create or replace function public.duplicate_draft_lesson_activity(
  requested_activity_id bigint,
  expected_lesson_version_id bigint
)
returns public.lesson_activities
language plpgsql
security definer
set search_path = ''
as $$
declare
  source_activity public.lesson_activities;
  result public.lesson_activities;
  next_position integer;
  source_assessment record;
  copied_assessment_id bigint;
  source_question record;
  copied_question_id bigint;
begin
  perform public.lock_content_hierarchy_gate();

  if not public.can_edit_drafts() then
    raise exception 'Draft editing permission is required';
  end if;

  select activity.*
  into source_activity
  from public.lesson_activities as activity
  join public.lesson_versions as version
    on version.id = activity.lesson_version_id
  join public.lessons as lesson
    on lesson.id = version.lesson_id
  join public.units as unit
    on unit.id = lesson.unit_id
  join public.courses as course
    on course.id = unit.course_id
  where activity.id = requested_activity_id
    and activity.lesson_version_id = expected_lesson_version_id
    and version.status = 'draft'
    and lesson.status = 'draft'
    and unit.status = 'draft'
    and course.status = 'draft'
  for update of
    activity, version, lesson, unit, course;
  if not found then
    raise exception 'The expected draft activity is unavailable';
  end if;

  perform 1
  from public.lesson_activities as activity
  where activity.lesson_version_id = expected_lesson_version_id
  order by activity.id
  for update;

  select coalesce(max(position), -1) + 1
  into next_position
  from public.lesson_activities
  where lesson_version_id = expected_lesson_version_id;

  insert into public.lesson_activities (
    lesson_version_id, type, title, position, required
  ) values (
    expected_lesson_version_id,
    source_activity.type,
    source_activity.title || ' copy',
    next_position,
    source_activity.required
  ) returning * into result;

  insert into public.theory_blocks (
    activity_id, block_type, position, heading_level,
    title, text, media_asset_id, alt_text
  )
  select result.id, block_type, position, heading_level,
    title, text, media_asset_id, alt_text
  from public.theory_blocks
  where activity_id = requested_activity_id;

  insert into public.listening_items (
    activity_id, title, instructions, transcript,
    audio_asset_id, position
  )
  select result.id, title, instructions, transcript,
    audio_asset_id, position
  from public.listening_items
  where activity_id = requested_activity_id;

  insert into public.pronunciation_items (
    activity_id, title, instructions, display_text,
    audio_asset_id, position
  )
  select result.id, title, instructions, display_text,
    audio_asset_id, position
  from public.pronunciation_items
  where activity_id = requested_activity_id;

  for source_assessment in
    select assessment.*
    from public.assessment_sets as assessment
    where assessment.activity_id =
      requested_activity_id
    order by assessment.position
  loop
    if source_assessment.listening_item_id
      is not null
    then
      raise exception
        'Activities with linked listening assessments cannot be duplicated safely';
    end if;

    insert into public.assessment_sets (
      activity_id, title, instructions, position
    ) values (
      result.id,
      source_assessment.title,
      source_assessment.instructions,
      source_assessment.position
    ) returning id into copied_assessment_id;

    for source_question in
      select question.*
      from public.questions as question
      where question.assessment_set_id =
        source_assessment.id
      order by question.position
    loop
      insert into public.questions (
        assessment_set_id, prompt, explanation,
        position, required
      ) values (
        copied_assessment_id,
        source_question.prompt,
        source_question.explanation,
        source_question.position,
        source_question.required
      ) returning id into copied_question_id;

      insert into public.question_options (
        question_id, text, position, is_correct
      )
      select
        copied_question_id,
        option.text,
        option.position,
        option.is_correct
      from public.question_options as option
      where option.question_id = source_question.id
      order by option.position;
    end loop;
  end loop;

  return result;
end;
$$;

revoke all on function
  public.duplicate_draft_lesson_activity(bigint, bigint)
  from public, anon;
grant execute on function
  public.duplicate_draft_lesson_activity(bigint, bigint)
  to authenticated;

commit;
