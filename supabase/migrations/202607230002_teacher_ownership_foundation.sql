begin;

alter table public.courses
  add column owner_user_id uuid
    references auth.users(id) on delete restrict;

do $$
declare
  fallback_admin_id uuid;
begin
  select role.user_id
  into fallback_admin_id
  from public.user_roles role
  where role.role = 'admin'
  order by role.created_at, role.user_id
  limit 1;

  update public.courses course
  set owner_user_id = coalesce(
    (
      select course.created_by
      where course.created_by is not null
        and exists (
          select 1
          from public.user_roles creator_role
          where creator_role.user_id = course.created_by
            and creator_role.role in ('editor', 'admin')
        )
    ),
    fallback_admin_id
  );

  if exists (
    select 1
    from public.courses
    where owner_user_id is null
  ) then
    raise exception
      'Existing courses require an administrator owner before ownership migration';
  end if;
end;
$$;

alter table public.courses
  alter column owner_user_id set not null,
  alter column owner_user_id set default auth.uid();

alter table public.courses
  drop constraint courses_position_unique,
  add constraint courses_owner_position_unique
    unique (owner_user_id, position);

create index courses_owner_user_id_idx
  on public.courses(owner_user_id);

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_admin_role('admin');
$$;

create or replace function public.is_content_teacher()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.has_admin_role('teacher')
    or public.has_admin_role('editor');
$$;

create or replace function public.can_manage_content()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.is_content_teacher()
    or public.has_admin_role('publisher')
    or public.is_platform_admin();
$$;

create or replace function public.can_edit_drafts()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.is_content_teacher()
    or public.is_platform_admin();
$$;

create or replace function public.can_publish_content()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.has_admin_role('teacher')
    or public.has_admin_role('publisher')
    or public.is_platform_admin();
$$;

create or replace function public.can_create_courses()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.is_content_teacher()
    or public.is_platform_admin();
$$;

create or replace function public.can_view_all_courses()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.has_admin_role('publisher')
    or public.is_platform_admin();
$$;

create or replace function public.is_course_owner(
  requested_course_id bigint
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.courses course
    where course.id = requested_course_id
      and course.owner_user_id = auth.uid()
  );
$$;

create or replace function public.can_view_private_course(
  requested_course_id bigint
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.can_view_all_courses()
    or (
      public.is_content_teacher()
      and public.is_course_owner(requested_course_id)
    );
$$;

create or replace function public.can_edit_course(
  requested_course_id bigint
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.is_platform_admin()
    or (
      public.is_content_teacher()
      and public.is_course_owner(requested_course_id)
    );
$$;

create or replace function public.can_publish_course(
  requested_course_id bigint
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.is_platform_admin()
    or public.has_admin_role('publisher')
    or (
      public.has_admin_role('teacher')
      and public.is_course_owner(requested_course_id)
    );
$$;

create or replace function public.content_row_course_id(
  requested_table text,
  requested_row jsonb
)
returns bigint
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result bigint;
  parent_id bigint;
begin
  if requested_table = 'courses' then
    return (requested_row ->> 'id')::bigint;
  elsif requested_table = 'units' then
    return (requested_row ->> 'course_id')::bigint;
  elsif requested_table = 'lessons' then
    parent_id := (requested_row ->> 'unit_id')::bigint;
    select unit.course_id into result
    from public.units unit
    where unit.id = parent_id;
  elsif requested_table = 'lesson_versions' then
    parent_id := (requested_row ->> 'lesson_id')::bigint;
    select unit.course_id into result
    from public.lessons lesson
    join public.units unit on unit.id = lesson.unit_id
    where lesson.id = parent_id;
  elsif requested_table = 'lesson_activities' then
    parent_id := (requested_row ->> 'lesson_version_id')::bigint;
    select unit.course_id into result
    from public.lesson_versions version
    join public.lessons lesson on lesson.id = version.lesson_id
    join public.units unit on unit.id = lesson.unit_id
    where version.id = parent_id;
  elsif requested_table in (
    'theory_blocks',
    'listening_items',
    'pronunciation_items',
    'assessment_sets',
    'ai_speaking_missions',
    'interactive_practice_exercises'
  ) then
    parent_id := (requested_row ->> 'activity_id')::bigint;
    select unit.course_id into result
    from public.lesson_activities activity
    join public.lesson_versions version
      on version.id = activity.lesson_version_id
    join public.lessons lesson on lesson.id = version.lesson_id
    join public.units unit on unit.id = lesson.unit_id
    where activity.id = parent_id;
  elsif requested_table = 'questions' then
    parent_id := (requested_row ->> 'assessment_set_id')::bigint;
    select unit.course_id into result
    from public.assessment_sets assessment
    join public.lesson_activities activity
      on activity.id = assessment.activity_id
    join public.lesson_versions version
      on version.id = activity.lesson_version_id
    join public.lessons lesson on lesson.id = version.lesson_id
    join public.units unit on unit.id = lesson.unit_id
    where assessment.id = parent_id;
  elsif requested_table = 'question_options' then
    parent_id := (requested_row ->> 'question_id')::bigint;
    select unit.course_id into result
    from public.questions question
    join public.assessment_sets assessment
      on assessment.id = question.assessment_set_id
    join public.lesson_activities activity
      on activity.id = assessment.activity_id
    join public.lesson_versions version
      on version.id = activity.lesson_version_id
    join public.lessons lesson on lesson.id = version.lesson_id
    join public.units unit on unit.id = lesson.unit_id
    where question.id = parent_id;
  else
    raise exception
      'Unsupported ownership table: %',
      requested_table;
  end if;

  return result;
end;
$$;

create or replace function public.can_view_private_content_row(
  requested_table text,
  requested_row jsonb
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.can_view_private_course(
    public.content_row_course_id(
      requested_table,
      requested_row
    )
  );
$$;

create or replace function public.can_edit_content_row(
  requested_table text,
  requested_row jsonb
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.can_edit_course(
    public.content_row_course_id(
      requested_table,
      requested_row
    )
  );
$$;

create or replace function public.can_publish_content_row(
  requested_table text,
  requested_row jsonb
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.can_publish_course(
    public.content_row_course_id(
      requested_table,
      requested_row
    )
  );
$$;

create or replace function public.enforce_content_ownership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  course_id bigint;
  row_data jsonb;
  publication_active boolean;
begin
  if tg_table_name = 'courses' and tg_op = 'INSERT' then
    if not public.can_create_courses() then
      raise exception 'Teacher or administrator role required';
    end if;

    new.owner_user_id := auth.uid();
    return new;
  end if;

  row_data := case
    when tg_op = 'DELETE' then to_jsonb(old)
    else to_jsonb(new)
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
    and new.owner_user_id <> old.owner_user_id
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
      and to_jsonb(new) ? 'status'
      and (to_jsonb(new) -> 'status')
        is distinct from (to_jsonb(old) -> 'status')
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

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'courses',
    'units',
    'lessons',
    'lesson_versions',
    'lesson_activities',
    'theory_blocks',
    'listening_items',
    'pronunciation_items',
    'assessment_sets',
    'questions',
    'question_options',
    'ai_speaking_missions',
    'interactive_practice_exercises'
  ]
  loop
    execute pg_catalog.format(
      'drop trigger if exists enforce_content_ownership on public.%I',
      table_name
    );
    execute pg_catalog.format(
      'create trigger enforce_content_ownership before insert or update or delete on public.%I for each row execute function public.enforce_content_ownership()',
      table_name
    );
  end loop;
end;
$$;

do $$
declare
  policy_row record;
begin
  for policy_row in
    select schemaname, tablename, policyname
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename in (
        'courses',
        'units',
        'lessons',
        'lesson_versions',
        'lesson_activities',
        'theory_blocks',
        'listening_items',
        'pronunciation_items',
        'assessment_sets',
        'questions',
        'question_options',
        'ai_speaking_missions',
        'interactive_practice_exercises'
      )
  loop
    execute pg_catalog.format(
      'drop policy %I on %I.%I',
      policy_row.policyname,
      policy_row.schemaname,
      policy_row.tablename
    );
  end loop;
end;
$$;

create policy courses_select_published_or_owned
on public.courses for select
to anon, authenticated
using (
  status = 'published'
  or public.can_view_private_course(id)
);

create policy courses_insert_owned_draft
on public.courses for insert
to authenticated
with check (
  public.can_create_courses()
  and owner_user_id = auth.uid()
  and status = 'draft'
);

create policy courses_update_owned_draft
on public.courses for update
to authenticated
using (
  public.can_edit_course(id)
  and status = 'draft'
)
with check (
  public.can_edit_course(id)
  and status = 'draft'
);

create policy courses_publish_owned
on public.courses for update
to authenticated
using (public.can_publish_course(id))
with check (public.can_publish_course(id));

create policy courses_delete_owned_draft
on public.courses for delete
to authenticated
using (
  public.can_edit_course(id)
  and status = 'draft'
);

create policy units_select_published_or_owned
on public.units for select
to anon, authenticated
using (
  (
    status = 'published'
    and exists (
      select 1
      from public.courses course
      where course.id = units.course_id
        and course.status = 'published'
    )
  )
  or public.can_view_private_content_row(
    'units',
    to_jsonb(units)
  )
);

create policy units_mutate_owned_draft
on public.units for all
to authenticated
using (
  public.can_edit_content_row('units', to_jsonb(units))
  and status = 'draft'
)
with check (
  public.can_edit_content_row('units', to_jsonb(units))
  and status = 'draft'
);

create policy units_publish_owned
on public.units for update
to authenticated
using (
  public.can_publish_course(course_id)
)
with check (
  public.can_publish_course(course_id)
);

create policy lessons_select_published_or_owned
on public.lessons for select
to anon, authenticated
using (
  (
    status = 'published'
    and current_published_version_id is not null
    and exists (
      select 1
      from public.units unit
      join public.courses course
        on course.id = unit.course_id
      where unit.id = lessons.unit_id
        and unit.status = 'published'
        and course.status = 'published'
    )
  )
  or public.can_view_private_content_row(
    'lessons',
    to_jsonb(lessons)
  )
);

create policy lessons_mutate_owned_draft
on public.lessons for all
to authenticated
using (
  public.can_edit_content_row('lessons', to_jsonb(lessons))
  and status = 'draft'
)
with check (
  public.can_edit_content_row('lessons', to_jsonb(lessons))
  and status = 'draft'
  and current_published_version_id is null
);

create policy lessons_publish_owned
on public.lessons for update
to authenticated
using (
  public.can_publish_content_row(
    'lessons',
    to_jsonb(lessons)
  )
)
with check (
  public.can_publish_content_row(
    'lessons',
    to_jsonb(lessons)
  )
);

create policy lesson_versions_select_published_or_owned
on public.lesson_versions for select
to anon, authenticated
using (
  public.is_published_lesson_version(id)
  or public.can_view_private_content_row(
    'lesson_versions',
    to_jsonb(lesson_versions)
  )
);

create policy lesson_versions_mutate_owned_draft
on public.lesson_versions for all
to authenticated
using (
  public.can_edit_content_row(
    'lesson_versions',
    to_jsonb(lesson_versions)
  )
  and status = 'draft'
)
with check (
  public.can_edit_content_row(
    'lesson_versions',
    to_jsonb(lesson_versions)
  )
  and status = 'draft'
);

create policy lesson_activities_select_published_or_owned
on public.lesson_activities for select
to anon, authenticated
using (
  public.is_published_lesson_version(lesson_version_id)
  or public.can_view_private_content_row(
    'lesson_activities',
    to_jsonb(lesson_activities)
  )
);

create policy lesson_activities_mutate_owned
on public.lesson_activities for all
to authenticated
using (
  public.can_edit_content_row(
    'lesson_activities',
    to_jsonb(lesson_activities)
  )
  and public.is_draft_activity(id)
)
with check (
  public.can_edit_content_row(
    'lesson_activities',
    to_jsonb(lesson_activities)
  )
);

create policy theory_blocks_select_published_or_owned
on public.theory_blocks for select
to anon, authenticated
using (
  public.is_published_activity(activity_id)
  or public.can_view_private_content_row(
    'theory_blocks',
    to_jsonb(theory_blocks)
  )
);

create policy theory_blocks_mutate_owned
on public.theory_blocks for all
to authenticated
using (
  public.can_edit_content_row(
    'theory_blocks',
    to_jsonb(theory_blocks)
  )
  and public.is_draft_activity(activity_id)
)
with check (
  public.can_edit_content_row(
    'theory_blocks',
    to_jsonb(theory_blocks)
  )
  and public.is_draft_activity(activity_id)
);

create policy listening_items_select_published_or_owned
on public.listening_items for select
to anon, authenticated
using (
  public.is_published_activity(activity_id)
  or public.can_view_private_content_row(
    'listening_items',
    to_jsonb(listening_items)
  )
);

create policy listening_items_mutate_owned
on public.listening_items for all
to authenticated
using (
  public.can_edit_content_row(
    'listening_items',
    to_jsonb(listening_items)
  )
  and public.is_draft_activity(activity_id)
)
with check (
  public.can_edit_content_row(
    'listening_items',
    to_jsonb(listening_items)
  )
  and public.is_draft_activity(activity_id)
);

create policy pronunciation_items_select_published_or_owned
on public.pronunciation_items for select
to anon, authenticated
using (
  public.is_published_activity(activity_id)
  or public.can_view_private_content_row(
    'pronunciation_items',
    to_jsonb(pronunciation_items)
  )
);

create policy pronunciation_items_mutate_owned
on public.pronunciation_items for all
to authenticated
using (
  public.can_edit_content_row(
    'pronunciation_items',
    to_jsonb(pronunciation_items)
  )
  and public.is_draft_activity(activity_id)
)
with check (
  public.can_edit_content_row(
    'pronunciation_items',
    to_jsonb(pronunciation_items)
  )
  and public.is_draft_activity(activity_id)
);

create policy assessment_sets_select_published_or_owned
on public.assessment_sets for select
to authenticated
using (
  public.is_published_activity(activity_id)
  or public.can_view_private_content_row(
    'assessment_sets',
    to_jsonb(assessment_sets)
  )
);

create policy assessment_sets_mutate_owned
on public.assessment_sets for all
to authenticated
using (
  public.can_edit_content_row(
    'assessment_sets',
    to_jsonb(assessment_sets)
  )
  and public.is_draft_activity(activity_id)
)
with check (
  public.can_edit_content_row(
    'assessment_sets',
    to_jsonb(assessment_sets)
  )
  and public.is_draft_activity(activity_id)
);

create policy questions_select_published_or_owned
on public.questions for select
to authenticated
using (
  public.is_published_assessment(assessment_set_id)
  or public.can_view_private_content_row(
    'questions',
    to_jsonb(questions)
  )
);

create policy questions_mutate_owned
on public.questions for all
to authenticated
using (
  public.can_edit_content_row(
    'questions',
    to_jsonb(questions)
  )
  and public.is_draft_assessment(assessment_set_id)
)
with check (
  public.can_edit_content_row(
    'questions',
    to_jsonb(questions)
  )
  and public.is_draft_assessment(assessment_set_id)
);

create policy question_options_select_published_or_owned
on public.question_options for select
to authenticated
using (
  public.is_published_question(question_id)
  or public.can_view_private_content_row(
    'question_options',
    to_jsonb(question_options)
  )
);

create policy question_options_mutate_owned
on public.question_options for all
to authenticated
using (
  public.can_edit_content_row(
    'question_options',
    to_jsonb(question_options)
  )
  and public.is_draft_question(question_id)
)
with check (
  public.can_edit_content_row(
    'question_options',
    to_jsonb(question_options)
  )
  and public.is_draft_question(question_id)
);

create policy ai_missions_select_published_or_owned
on public.ai_speaking_missions for select
to authenticated
using (
  public.is_published_activity(activity_id)
  or public.can_view_private_content_row(
    'ai_speaking_missions',
    to_jsonb(ai_speaking_missions)
  )
);

create policy ai_missions_mutate_owned
on public.ai_speaking_missions for all
to authenticated
using (
  public.can_edit_content_row(
    'ai_speaking_missions',
    to_jsonb(ai_speaking_missions)
  )
  and public.is_draft_activity(activity_id)
)
with check (
  public.can_edit_content_row(
    'ai_speaking_missions',
    to_jsonb(ai_speaking_missions)
  )
  and public.is_draft_activity(activity_id)
);

create policy interactive_practice_select_owned
on public.interactive_practice_exercises for select
to authenticated
using (
  public.can_view_private_content_row(
    'interactive_practice_exercises',
    to_jsonb(interactive_practice_exercises)
  )
);

create policy interactive_practice_mutate_owned
on public.interactive_practice_exercises for all
to authenticated
using (
  public.can_edit_content_row(
    'interactive_practice_exercises',
    to_jsonb(interactive_practice_exercises)
  )
  and public.is_draft_activity(activity_id)
)
with check (
  public.can_edit_content_row(
    'interactive_practice_exercises',
    to_jsonb(interactive_practice_exercises)
  )
  and public.is_draft_activity(activity_id)
);

alter function public.duplicate_draft_course(bigint)
  rename to duplicate_draft_course_before_ownership;

revoke all on function
  public.duplicate_draft_course_before_ownership(bigint)
  from public, anon, authenticated;

create or replace function public.duplicate_draft_course(
  requested_course_id bigint
)
returns public.courses
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.can_edit_course(requested_course_id) then
    raise exception
      'Only the course owner or an administrator can duplicate this course';
  end if;

  return public.duplicate_draft_course_before_ownership(
    requested_course_id
  );
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
  course_id bigint;
begin
  perform public.lock_content_hierarchy_gate();

  select version.*
  into version_row
  from public.lesson_versions version
  join public.lessons lesson on lesson.id = version.lesson_id
  join public.units unit on unit.id = lesson.unit_id
  where version.id = requested_lesson_version_id
  for update of version;

  if not found then
    raise exception 'Lesson version does not exist';
  end if;

  select unit.course_id
  into strict course_id
  from public.lessons lesson
  join public.units unit on unit.id = lesson.unit_id
  where lesson.id = version_row.lesson_id;

  if not public.can_publish_course(course_id) then
    raise exception
      'Course publication permission is required';
  end if;

  if version_row.status <> 'draft' then
    raise exception
      'Only a draft lesson version can be published';
  end if;

  perform public.validate_lesson_version_listening_audio(
    version_row.id
  );
  perform public.validate_lesson_version_pronunciation_blocks(
    version_row.id
  );
  perform public.validate_lesson_version_media(
    version_row.id
  );
  perform public.validate_lesson_version_ai_missions(
    version_row.id
  );
  perform public.validate_lesson_version_interactive_practice(
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

revoke all on function public.is_platform_admin()
  from public, anon;
revoke all on function public.is_content_teacher()
  from public, anon;
revoke all on function public.can_create_courses()
  from public, anon;
revoke all on function public.can_view_all_courses()
  from public, anon;
revoke all on function public.is_course_owner(bigint)
  from public, anon;
revoke all on function public.can_view_private_course(bigint)
  from public, anon;
revoke all on function public.can_edit_course(bigint)
  from public, anon;
revoke all on function public.can_publish_course(bigint)
  from public, anon;
revoke all on function
  public.content_row_course_id(text, jsonb)
  from public, anon, authenticated;
revoke all on function
  public.can_view_private_content_row(text, jsonb)
  from public, anon;
revoke all on function
  public.can_edit_content_row(text, jsonb)
  from public, anon;
revoke all on function
  public.can_publish_content_row(text, jsonb)
  from public, anon;
revoke all on function public.enforce_content_ownership()
  from public, anon, authenticated;
revoke all on function public.duplicate_draft_course(bigint)
  from public, anon;
revoke all on function public.publish_lesson_version(bigint)
  from public;

grant execute on function public.is_platform_admin()
  to authenticated;
grant execute on function public.is_content_teacher()
  to authenticated;
grant execute on function public.can_create_courses()
  to authenticated;
grant execute on function public.can_view_all_courses()
  to authenticated;
grant execute on function public.is_course_owner(bigint)
  to authenticated;
grant execute on function public.can_view_private_course(bigint)
  to authenticated;
grant execute on function public.can_edit_course(bigint)
  to authenticated;
grant execute on function public.can_publish_course(bigint)
  to authenticated;
grant execute on function
  public.can_view_private_content_row(text, jsonb)
  to authenticated;
grant execute on function
  public.can_edit_content_row(text, jsonb)
  to authenticated;
grant execute on function
  public.can_publish_content_row(text, jsonb)
  to authenticated;
grant execute on function public.duplicate_draft_course(bigint)
  to authenticated;
grant execute on function public.publish_lesson_version(bigint)
  to authenticated;

commit;
