begin;

-- Publishing policies must only permit a draft-to-published transition.
-- Trigger protections below additionally ensure that publishing cannot be
-- combined with an in-place rewrite of the draft.
drop policy if exists "courses_publish"
  on public.courses;
create policy "courses_publish"
on public.courses for update
to authenticated
using (
  public.can_publish_content()
  and status = 'draft'
)
with check (
  public.can_publish_content()
  and status = 'published'
);

drop policy if exists "units_publish"
  on public.units;
create policy "units_publish"
on public.units for update
to authenticated
using (
  public.can_publish_content()
  and status = 'draft'
)
with check (
  public.can_publish_content()
  and status = 'published'
);

drop policy if exists "lessons_publish"
  on public.lessons;
create policy "lessons_publish"
on public.lessons for update
to authenticated
using (
  public.can_publish_content()
  and status = 'draft'
)
with check (
  public.can_publish_content()
  and status = 'published'
  and current_published_version_id is not null
);

drop policy if exists "lesson_versions_publish"
  on public.lesson_versions;
create policy "lesson_versions_publish"
on public.lesson_versions for update
to authenticated
using (
  public.can_publish_content()
  and status = 'draft'
)
with check (
  public.can_publish_content()
  and status = 'published'
);

drop policy if exists "media_assets_publish"
  on public.media_assets;
create policy "media_assets_publish"
on public.media_assets for update
to authenticated
using (
  public.can_publish_content()
  and status = 'draft'
)
with check (
  public.can_publish_content()
  and status = 'published'
);

-- Publishers may unpublish and later republish the same sealed record. The
-- immutability triggers permit only the lifecycle status change.
create policy "courses_change_publication_status"
on public.courses for update
to authenticated
using (
  public.can_publish_content()
  and status in ('published', 'unpublished')
)
with check (
  public.can_publish_content()
  and status in ('published', 'unpublished')
);

create policy "units_change_publication_status"
on public.units for update
to authenticated
using (
  public.can_publish_content()
  and status in ('published', 'unpublished')
)
with check (
  public.can_publish_content()
  and status in ('published', 'unpublished')
);

create policy "lessons_change_publication_status"
on public.lessons for update
to authenticated
using (
  public.can_publish_content()
  and status in ('published', 'unpublished')
)
with check (
  public.can_publish_content()
  and status in ('published', 'unpublished')
);

create policy "media_assets_change_publication_status"
on public.media_assets for update
to authenticated
using (
  public.can_publish_content()
  and status in ('published', 'unpublished')
)
with check (
  public.can_publish_content()
  and status in ('published', 'unpublished')
);

-- Published and retired top-level records may only change lifecycle status.
-- Their learner-facing and identity fields remain immutable, including for
-- administrators and service-level callers that bypass RLS.
create or replace function public.protect_publishable_content()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  old_content jsonb;
  new_content jsonb;
  publishable_fields text[] := array[
    'status',
    'published_at',
    'updated_at',
    'updated_by'
  ];
  sealed_fields text[] := array[
    'status',
    'updated_at',
    'updated_by'
  ];
begin
  if tg_op = 'DELETE' then
    if old.status in (
      'published',
      'unpublished',
      'archived'
    )
    then
      raise exception
        'Published or retired % records are immutable',
        tg_table_name;
    end if;

    return old;
  end if;

  if old.status = 'draft'
    and new.status = 'published'
  then
    if tg_table_name = 'lessons' then
      publishable_fields :=
        publishable_fields
        || array['current_published_version_id'];
    end if;

    old_content :=
      to_jsonb(old) - publishable_fields;
    new_content :=
      to_jsonb(new) - publishable_fields;

    if new_content is distinct from old_content then
      raise exception
        'Publishing cannot rewrite % content',
        tg_table_name;
    end if;
  end if;

  if old.status in (
    'published',
    'unpublished',
    'archived'
  )
  then
    if new.status = 'draft'
      or (
        old.status = 'archived'
        and new.status <> 'archived'
      )
    then
      raise exception
        'Invalid lifecycle transition for sealed % record',
        tg_table_name;
    end if;

    old_content := to_jsonb(old) - sealed_fields;
    new_content := to_jsonb(new) - sealed_fields;

    if new_content is distinct from old_content then
      raise exception
        'Published or retired % records are immutable',
        tg_table_name;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists courses_protect_published
  on public.courses;
create trigger courses_protect_published
before update or delete on public.courses
for each row
execute function public.protect_publishable_content();

drop trigger if exists units_protect_published
  on public.units;
create trigger units_protect_published
before update or delete on public.units
for each row
execute function public.protect_publishable_content();

drop trigger if exists lessons_protect_published
  on public.lessons;
create trigger lessons_protect_published
before update or delete on public.lessons
for each row
execute function public.protect_publishable_content();

-- A lesson version may be published once and later archived, but its identity
-- and publication metadata cannot be rewritten after publication.
create or replace function public.protect_published_lesson_version()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  old_content jsonb;
  new_content jsonb;
begin
  if old.status = 'draft'
    and new.status = 'published'
  then
    old_content :=
      to_jsonb(old) - array[
        'status',
        'published_by',
        'published_at',
        'updated_at'
      ];
    new_content :=
      to_jsonb(new) - array[
        'status',
        'published_by',
        'published_at',
        'updated_at'
      ];

    if new_content is distinct from old_content then
      raise exception
        'Publishing cannot rewrite lesson version identity';
    end if;
  end if;

  if old.status in (
    'published',
    'archived'
  )
  then
    if new.status not in (
      'published',
      'archived'
    )
    then
      raise exception
        'Published or archived lesson versions cannot return to draft';
    end if;

    old_content :=
      to_jsonb(old) - array['status', 'updated_at'];
    new_content :=
      to_jsonb(new) - array['status', 'updated_at'];

    if new_content is distinct from old_content then
      raise exception
        'Published lesson versions are immutable';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.protect_sealed_lesson_version_delete()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status in (
    'published',
    'archived'
  )
  then
    raise exception
      'Published or archived lesson versions are immutable';
  end if;

  return old;
end;
$$;

drop trigger if exists lesson_versions_protect_delete
  on public.lesson_versions;
create trigger lesson_versions_protect_delete
before delete on public.lesson_versions
for each row
execute function public.protect_sealed_lesson_version_delete();

-- Resolve a content row to its owning lesson version. This function is used
-- only from the trigger below and is not exposed through the API.
create or replace function public.content_lesson_version_status(
  content_table text,
  content_row jsonb
)
returns public.lesson_version_status
language plpgsql
stable
set search_path = ''
as $$
declare
  version_status public.lesson_version_status;
begin
  case content_table
    when 'lesson_activities' then
      select version.status
      into version_status
      from public.lesson_versions as version
      where version.id =
        (content_row ->> 'lesson_version_id')::bigint;

    when 'theory_blocks',
      'listening_items',
      'pronunciation_items',
      'assessment_sets'
    then
      select version.status
      into version_status
      from public.lesson_activities as activity
      join public.lesson_versions as version
        on version.id = activity.lesson_version_id
      where activity.id =
        (content_row ->> 'activity_id')::bigint;

    when 'questions' then
      select version.status
      into version_status
      from public.assessment_sets as assessment
      join public.lesson_activities as activity
        on activity.id = assessment.activity_id
      join public.lesson_versions as version
        on version.id = activity.lesson_version_id
      where assessment.id =
        (content_row ->> 'assessment_set_id')::bigint;

    when 'question_options' then
      select version.status
      into version_status
      from public.questions as question
      join public.assessment_sets as assessment
        on assessment.id = question.assessment_set_id
      join public.lesson_activities as activity
        on activity.id = assessment.activity_id
      join public.lesson_versions as version
        on version.id = activity.lesson_version_id
      where question.id =
        (content_row ->> 'question_id')::bigint;

    else
      raise exception
        'Unsupported versioned content table: %',
        content_table;
  end case;

  return version_status;
end;
$$;

revoke all on function public.content_lesson_version_status(
  text,
  jsonb
) from public;

create or replace function public.protect_versioned_content()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  old_status public.lesson_version_status;
  new_status public.lesson_version_status;
begin
  if tg_op <> 'INSERT' then
    old_status :=
      public.content_lesson_version_status(
        tg_table_name,
        to_jsonb(old)
      );

    if old_status in (
      'published',
      'archived'
    )
    then
      raise exception
        'Content belonging to a published lesson version is immutable';
    end if;
  end if;

  if tg_op <> 'DELETE' then
    new_status :=
      public.content_lesson_version_status(
        tg_table_name,
        to_jsonb(new)
      );

    if new_status in (
      'published',
      'archived'
    )
    then
      raise exception
        'Content cannot be added or moved into a published lesson version';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

revoke all on function public.protect_versioned_content()
  from public;

drop trigger if exists lesson_activities_protect_published
  on public.lesson_activities;
create trigger lesson_activities_protect_published
before insert or update or delete on public.lesson_activities
for each row
execute function public.protect_versioned_content();

drop trigger if exists theory_blocks_protect_published
  on public.theory_blocks;
create trigger theory_blocks_protect_published
before insert or update or delete on public.theory_blocks
for each row
execute function public.protect_versioned_content();

drop trigger if exists listening_items_protect_published
  on public.listening_items;
create trigger listening_items_protect_published
before insert or update or delete on public.listening_items
for each row
execute function public.protect_versioned_content();

drop trigger if exists pronunciation_items_protect_published
  on public.pronunciation_items;
create trigger pronunciation_items_protect_published
before insert or update or delete on public.pronunciation_items
for each row
execute function public.protect_versioned_content();

drop trigger if exists assessment_sets_protect_published
  on public.assessment_sets;
create trigger assessment_sets_protect_published
before insert or update or delete on public.assessment_sets
for each row
execute function public.protect_versioned_content();

drop trigger if exists questions_protect_published
  on public.questions;
create trigger questions_protect_published
before insert or update or delete on public.questions
for each row
execute function public.protect_versioned_content();

drop trigger if exists question_options_protect_published
  on public.question_options;
create trigger question_options_protect_published
before insert or update or delete on public.question_options
for each row
execute function public.protect_versioned_content();

-- Published media metadata cannot be repointed, rewritten, returned to draft,
-- or deleted. A draft may change while being prepared and may transition once
-- into a published record.
create or replace function public.protect_published_media_asset()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  old_content jsonb;
  new_content jsonb;
begin
  if tg_op = 'DELETE' then
    if old.status in (
      'published',
      'unpublished',
      'archived'
    )
    then
      raise exception
        'Published or retired media assets are immutable';
    end if;

    return old;
  end if;

  if old.status = 'draft'
    and new.status = 'published'
  then
    old_content :=
      to_jsonb(old) - array[
        'bucket',
        'object_path',
        'status',
        'published_by',
        'published_at',
        'updated_at'
      ];
    new_content :=
      to_jsonb(new) - array[
        'bucket',
        'object_path',
        'status',
        'published_by',
        'published_at',
        'updated_at'
      ];

    if new_content is distinct from old_content then
      raise exception
        'Publishing cannot rewrite media asset identity or ownership';
    end if;
  end if;

  if old.status in (
    'published',
    'unpublished',
    'archived'
  )
  then
    if new.status = 'draft'
      or (
        old.status = 'archived'
        and new.status <> 'archived'
      )
    then
      raise exception
        'Invalid lifecycle transition for sealed media asset';
    end if;

    old_content :=
      to_jsonb(old) - array['status', 'updated_at'];
    new_content :=
      to_jsonb(new) - array['status', 'updated_at'];

    if new_content is distinct from old_content then
      raise exception
        'Published or retired media asset metadata is immutable';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists media_assets_protect_published
  on public.media_assets;
create trigger media_assets_protect_published
before update or delete on public.media_assets
for each row
execute function public.protect_published_media_asset();

-- Deletion policies no longer imply that administrators may delete sealed
-- learner-facing records. Trigger protections remain the final enforcement
-- layer for all database roles.
drop policy if exists "courses_delete_admin"
  on public.courses;
drop policy if exists "units_delete_admin"
  on public.units;
drop policy if exists "lessons_delete_admin"
  on public.lessons;
drop policy if exists "media_assets_delete_admin"
  on public.media_assets;

drop policy if exists "lesson_versions_delete_draft"
  on public.lesson_versions;
create policy "lesson_versions_delete_draft"
on public.lesson_versions for delete
to authenticated
using (
  public.has_admin_role('admin')
  and status = 'draft'
);

-- The answer-key table is directly readable only by content managers.
-- Learners receive an intentionally narrow result through the RPC below.
drop policy if exists
  "question_options_select_published_or_manager"
  on public.question_options;
create policy "question_options_select_manager"
on public.question_options for select
to authenticated
using (public.can_manage_content());

revoke select on public.question_options
  from anon;

-- Explanations are assessment feedback and may disclose an answer. Keep them
-- on the manager-only base table and expose only question fields required to
-- render a published assessment.
drop policy if exists
  "questions_select_published_or_manager"
  on public.questions;
create policy "questions_select_manager"
on public.questions for select
to authenticated
using (public.can_manage_content());

revoke select on public.questions
  from anon;

create or replace function public.get_published_assessment_questions(
  requested_assessment_set_id bigint
)
returns table (
  id bigint,
  assessment_set_id bigint,
  prompt text,
  "position" integer,
  required boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    question.id,
    question.assessment_set_id,
    question.prompt,
    question.position,
    question.required
  from public.questions as question
  where question.assessment_set_id =
      requested_assessment_set_id
    and public.is_published_assessment(
      requested_assessment_set_id
    )
  order by question.position;
$$;

revoke all on function
  public.get_published_assessment_questions(bigint)
  from public;
grant execute on function
  public.get_published_assessment_questions(bigint)
  to anon, authenticated;

create or replace function public.get_published_question_options(
  requested_question_id bigint
)
returns table (
  id bigint,
  question_id bigint,
  text text,
  "position" integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    option.id,
    option.question_id,
    option.text,
    option.position
  from public.question_options as option
  where option.question_id = requested_question_id
    and public.is_published_question(
      requested_question_id
    )
  order by option.position;
$$;

revoke all on function
  public.get_published_question_options(bigint)
  from public;
grant execute on function
  public.get_published_question_options(bigint)
  to anon, authenticated;

commit;
