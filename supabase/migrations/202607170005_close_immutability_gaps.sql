begin;

-- Every hierarchy mutation and lesson-version lifecycle change takes this
-- transaction-scoped gate before inspecting ownership. It closes the
-- statement-snapshot race between a descendant mutation and parent movement.
create or replace function public.lock_content_hierarchy_gate()
returns void
language plpgsql
volatile
set search_path = ''
as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(
    188654525,
    1
  );
end;
$$;

revoke all on function
  public.lock_content_hierarchy_gate()
  from public;

create or replace function public.lock_content_hierarchy_statement()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform public.lock_content_hierarchy_gate();
  return null;
end;
$$;

revoke all on function
  public.lock_content_hierarchy_statement()
  from public;

-- Statement triggers acquire the global gate before PostgreSQL targets and
-- row-locks any OLD rows. This prevents lock inversion between a parent move,
-- a descendant mutation, and lesson-version publication.
drop trigger if exists lesson_versions_lock_hierarchy
  on public.lesson_versions;
create trigger lesson_versions_lock_hierarchy
before insert or update or delete
on public.lesson_versions
for each statement
execute function
  public.lock_content_hierarchy_statement();

drop trigger if exists lesson_activities_lock_hierarchy
  on public.lesson_activities;
create trigger lesson_activities_lock_hierarchy
before insert or update or delete
on public.lesson_activities
for each statement
execute function
  public.lock_content_hierarchy_statement();

drop trigger if exists theory_blocks_lock_hierarchy
  on public.theory_blocks;
create trigger theory_blocks_lock_hierarchy
before insert or update or delete
on public.theory_blocks
for each statement
execute function
  public.lock_content_hierarchy_statement();

drop trigger if exists listening_items_lock_hierarchy
  on public.listening_items;
create trigger listening_items_lock_hierarchy
before insert or update or delete
on public.listening_items
for each statement
execute function
  public.lock_content_hierarchy_statement();

drop trigger if exists pronunciation_items_lock_hierarchy
  on public.pronunciation_items;
create trigger pronunciation_items_lock_hierarchy
before insert or update or delete
on public.pronunciation_items
for each statement
execute function
  public.lock_content_hierarchy_statement();

drop trigger if exists assessment_sets_lock_hierarchy
  on public.assessment_sets;
create trigger assessment_sets_lock_hierarchy
before insert or update or delete
on public.assessment_sets
for each statement
execute function
  public.lock_content_hierarchy_statement();

drop trigger if exists questions_lock_hierarchy
  on public.questions;
create trigger questions_lock_hierarchy
before insert or update or delete
on public.questions
for each statement
execute function
  public.lock_content_hierarchy_statement();

drop trigger if exists question_options_lock_hierarchy
  on public.question_options;
create trigger question_options_lock_hierarchy
before insert or update or delete
on public.question_options
for each statement
execute function
  public.lock_content_hierarchy_statement();

-- Lock all concrete parents traversed by a content row. IDs at each level are
-- locked ascending, and levels are locked leaf-to-root:
-- question -> assessment -> activity -> lesson_version. FOR UPDATE conflicts
-- with every UPDATE and DELETE of those rows.
create or replace function public.lock_content_hierarchy(
  content_table text,
  content_row jsonb
)
returns public.lesson_version_status
language plpgsql
volatile
set search_path = ''
as $$
declare
  parent_question_id bigint;
  parent_assessment_id bigint;
  parent_activity_id bigint;
  parent_version_id bigint;
  version_status public.lesson_version_status;
begin
  case content_table
    when 'lesson_activities' then
      parent_version_id :=
        (content_row ->> 'lesson_version_id')::bigint;

    when 'theory_blocks',
      'listening_items',
      'pronunciation_items',
      'assessment_sets'
    then
      parent_activity_id :=
        (content_row ->> 'activity_id')::bigint;

    when 'questions' then
      parent_assessment_id :=
        (content_row ->> 'assessment_set_id')::bigint;

    when 'question_options' then
      parent_question_id :=
        (content_row ->> 'question_id')::bigint;

    else
      raise exception
        'Unsupported versioned content table: %',
        content_table;
  end case;

  if parent_question_id is not null then
    select question.assessment_set_id
    into parent_assessment_id
    from public.questions as question
    where question.id = parent_question_id
    for update;

    if not found then
      raise exception
        'Unable to lock the content question hierarchy';
    end if;
  end if;

  if parent_assessment_id is not null then
    select assessment.activity_id
    into parent_activity_id
    from public.assessment_sets as assessment
    where assessment.id = parent_assessment_id
    for update;

    if not found then
      raise exception
        'Unable to lock the content assessment hierarchy';
    end if;
  end if;

  if parent_activity_id is not null then
    select activity.lesson_version_id
    into parent_version_id
    from public.lesson_activities as activity
    where activity.id = parent_activity_id
    for update;

    if not found then
      raise exception
        'Unable to lock the content activity hierarchy';
    end if;
  end if;

  select version.status
  into version_status
  from public.lesson_versions as version
  where version.id = parent_version_id
  for update;

  if not found then
    raise exception
      'Unable to lock the content lesson version';
  end if;

  return version_status;
end;
$$;

revoke all on function public.lock_content_hierarchy(
  text,
  jsonb
) from public;

create or replace function public.protect_versioned_content()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  hierarchy_row jsonb;
  hierarchy_key text;
  hierarchy_status public.lesson_version_status;
begin
  perform public.lock_content_hierarchy_gate();

  -- OLD and NEW paths are sorted by their JSON representation. The global
  -- gate makes this ordering deterministic across all participating writes.
  for hierarchy_row, hierarchy_key in
    select candidate.row_data, candidate.row_key
    from (
      select to_jsonb(old) as row_data,
        to_jsonb(old)::text as row_key
      where tg_op <> 'INSERT'
      union
      select to_jsonb(new),
        to_jsonb(new)::text
      where tg_op <> 'DELETE'
    ) as candidate
    order by candidate.row_key
  loop
    hierarchy_status :=
      public.lock_content_hierarchy(
        tg_table_name,
        hierarchy_row
      );

    if hierarchy_status in (
      'published',
      'archived'
    )
    then
      if tg_op = 'INSERT' then
        raise exception
          'Content cannot be added to a sealed lesson version';
      elsif tg_op = 'DELETE'
        or hierarchy_row = to_jsonb(old)
      then
        raise exception
          'Content belonging to a sealed lesson version is immutable';
      else
        raise exception
          'Content cannot be moved into a sealed lesson version';
      end if;
    end if;
  end loop;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

revoke all on function public.protect_versioned_content()
  from public;

-- The listening reference is a true same-activity relationship. The composite
-- foreign key also prevents later movement or deletion from breaking it.
do $$
begin
  if exists (
    select 1
    from public.assessment_sets as assessment
    join public.listening_items as listening
      on listening.id = assessment.listening_item_id
    where assessment.listening_item_id is not null
      and listening.activity_id <> assessment.activity_id
  )
  then
    raise exception
      'Cannot enforce assessment listening hierarchy: inconsistent rows exist';
  end if;
end;
$$;

alter table public.listening_items
  add constraint listening_items_id_activity_unique
  unique (id, activity_id);

alter table public.assessment_sets
  drop constraint assessment_sets_listening_item_id_fkey,
  add constraint assessment_sets_listening_same_activity_fkey
  foreign key (listening_item_id, activity_id)
  references public.listening_items (id, activity_id)
  on delete cascade;

-- Media publication uses a two-step Storage API workflow. The database issues
-- a one-time token bound to the exact draft Storage object; finalization only
-- accepts a destination object carrying both values in user_metadata.
alter table public.media_assets
  add column publication_token uuid,
  add column source_storage_object_id uuid,
  add column source_storage_object_version text,
  add column publication_requested_by uuid
    references auth.users (id) on delete set null,
  add column publication_prepared_at timestamptz,
  add column publication_expires_at timestamptz,
  add column publication_completed_at timestamptz,
  add column source_sha256 text,
  add column published_sha256 text,
  add constraint media_assets_source_sha256_format
    check (
      source_sha256 is null
      or source_sha256 ~ '^[0-9a-f]{64}$'
    ),
  add constraint media_assets_published_sha256_format
    check (
      published_sha256 is null
      or published_sha256 ~ '^[0-9a-f]{64}$'
    ),
  add constraint media_assets_verified_hashes_match
    check (
      source_sha256 is null
      or published_sha256 is null
      or source_sha256 = published_sha256
    );

create unique index media_assets_publication_token_unique
  on public.media_assets (publication_token)
  where publication_token is not null;

drop policy if exists "media_assets_publish"
  on public.media_assets;

create or replace function public.lock_media_gate()
returns void
language plpgsql
volatile
set search_path = ''
as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(
    188654525,
    2
  );
end;
$$;

revoke all on function public.lock_media_gate()
  from public;

create or replace function public.lock_media_statement()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform public.lock_content_hierarchy_gate();
  perform public.lock_media_gate();
  return null;
end;
$$;

revoke all on function
  public.lock_media_statement()
  from public;

drop trigger if exists media_assets_lock_lifecycle
  on public.media_assets;
create trigger media_assets_lock_lifecycle
before insert or update or delete
on public.media_assets
for each statement
execute function public.lock_media_statement();

drop trigger if exists storage_objects_lock_media
  on storage.objects;
create trigger storage_objects_lock_media
before update or delete
on storage.objects
for each statement
execute function public.lock_media_statement();

create or replace function public.prepare_media_publication(
  requested_media_asset_id uuid
)
returns table (
  media_asset_id uuid,
  source_bucket text,
  destination_bucket text,
  object_path text,
  publication_token uuid,
  source_storage_object_id uuid,
  source_storage_object_version text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  asset public.media_assets%rowtype;
  source_object storage.objects%rowtype;
  target_bucket text;
  issued_token uuid;
  manager_id uuid;
begin
  if not public.can_publish_content() then
    raise exception
      'Publisher or administrator role required';
  end if;

  manager_id := auth.uid();

  if manager_id is null then
    raise exception
      'Authenticated manager identity required';
  end if;

  perform public.lock_content_hierarchy_gate();
  perform public.lock_media_gate();

  select *
  into asset
  from public.media_assets
  where id = requested_media_asset_id
  for update;

  if not found or asset.status <> 'draft' then
    raise exception
      'Media asset must be an existing draft';
  end if;

  target_bucket := case asset.bucket
    when 'content-audio-drafts' then 'content-audio'
    when 'content-image-drafts' then 'content-images'
    else null
  end;

  if target_bucket is null then
    raise exception
      'Media asset is not in a supported draft bucket';
  end if;

  select storage_object.*
  into source_object
  from storage.objects as storage_object
  where storage_object.bucket_id = asset.bucket
    and storage_object.name = asset.object_path
  for share;

  if not found then
    raise exception
      'Draft Storage object is missing';
  end if;

  if source_object.owner_id is distinct from
      asset.uploaded_by::text
    or source_object.metadata ->> 'mimetype'
      is distinct from asset.mime_type
    or nullif(
      source_object.metadata ->> 'size',
      ''
    )::bigint is distinct from asset.size_bytes
  then
    raise exception
      'Draft Storage object ownership or metadata does not match';
  end if;

  issued_token := extensions.gen_random_uuid();
  perform pg_catalog.set_config(
    'pronouncelab.media_finalization',
    'on',
    true
  );

  update public.media_assets
  set publication_token = issued_token,
    source_storage_object_id = source_object.id,
    source_storage_object_version =
      coalesce(source_object.version, ''),
    publication_requested_by = manager_id,
    publication_prepared_at = now(),
    publication_expires_at =
      now() + interval '30 minutes',
    publication_completed_at = null,
    source_sha256 = null,
    published_sha256 = null
  where id = asset.id;

  return query
  select
    asset.id,
    asset.bucket,
    target_bucket,
    asset.object_path,
    issued_token,
    source_object.id,
    coalesce(source_object.version, '');
end;
$$;

revoke all on function
  public.prepare_media_publication(uuid)
  from public;
grant execute on function
  public.prepare_media_publication(uuid)
  to authenticated;

-- PostgreSQL cannot read or hash the physical Storage bytes. A trusted Edge
-- Function or backend must stream both the prepared source object and the
-- destination object, calculate SHA-256 for each, and pass both results here.
-- Browser and ordinary authenticated clients receive no EXECUTE privilege.
create or replace function public.finalize_media_publication(
  requested_media_asset_id uuid,
  requested_publication_token uuid,
  trusted_source_sha256 text,
  trusted_destination_sha256 text
)
returns public.media_assets
language plpgsql
security definer
set search_path = ''
as $$
declare
  asset public.media_assets%rowtype;
  source_object storage.objects%rowtype;
  destination_object storage.objects%rowtype;
  target_bucket text;
  finalized_asset public.media_assets%rowtype;
begin
  if coalesce(auth.role(), '') <>
      'service_role'
  then
    raise exception
      'Trusted backend role required';
  end if;

  perform public.lock_content_hierarchy_gate();
  perform public.lock_media_gate();

  select *
  into asset
  from public.media_assets
  where id = requested_media_asset_id
  for update;

  if not found
    or asset.status <> 'draft'
    or asset.publication_token is distinct from
      requested_publication_token
    or asset.source_storage_object_id is null
    or asset.source_storage_object_version is null
    or asset.publication_requested_by is null
    or asset.publication_expires_at is null
    or asset.publication_expires_at <= now()
    or asset.publication_completed_at is not null
  then
    raise exception
      'Media publication operation is invalid, expired, or already completed';
  end if;

  if trusted_source_sha256 is null
    or trusted_source_sha256 !~
      '^[0-9a-f]{64}$'
    or trusted_destination_sha256 is null
    or trusted_destination_sha256 !~
      '^[0-9a-f]{64}$'
    or trusted_source_sha256 is distinct from
      trusted_destination_sha256
  then
    raise exception
      'Trusted physical object SHA-256 verification failed';
  end if;

  target_bucket := case asset.bucket
    when 'content-audio-drafts' then 'content-audio'
    when 'content-image-drafts' then 'content-images'
    else null
  end;

  select storage_object.*
  into source_object
  from storage.objects as storage_object
  where storage_object.id =
      asset.source_storage_object_id
    and storage_object.bucket_id = asset.bucket
    and storage_object.name = asset.object_path
    and storage_object.version is not distinct from
      nullif(
        asset.source_storage_object_version,
        ''
      )
  for share;

  if not found then
    raise exception
      'Prepared draft Storage object is missing or changed';
  end if;

  select storage_object.*
  into destination_object
  from storage.objects as storage_object
  where storage_object.bucket_id = target_bucket
    and storage_object.name = asset.object_path
  for share;

  if not found then
    raise exception
      'Published Storage object is missing';
  end if;

  if destination_object.user_metadata ->>
      'publication_token'
      is distinct from asset.publication_token::text
    or destination_object.user_metadata ->>
      'source_storage_object_id'
      is distinct from asset.source_storage_object_id::text
    or destination_object.user_metadata ->>
      'source_storage_object_version'
      is distinct from asset.source_storage_object_version
    or destination_object.owner_id is distinct from
      asset.publication_requested_by::text
    or destination_object.metadata ->> 'mimetype'
      is distinct from asset.mime_type
    or nullif(
      destination_object.metadata ->> 'size',
      ''
    )::bigint is distinct from asset.size_bytes
  then
    raise exception
      'Published Storage object does not match the prepared media asset';
  end if;

  perform pg_catalog.set_config(
    'pronouncelab.media_finalization',
    'on',
    true
  );

  update public.media_assets
  set bucket = target_bucket,
    status = 'published',
    published_by = asset.publication_requested_by,
    published_at = now(),
    publication_completed_at = now(),
    source_sha256 = trusted_source_sha256,
    published_sha256 =
      trusted_destination_sha256
  where id = asset.id
    and publication_token =
      requested_publication_token
    and publication_completed_at is null
    and publication_expires_at > now()
  returning * into finalized_asset;

  if not found then
    raise exception
      'Media publication operation was concurrently completed or expired';
  end if;

  return finalized_asset;
end;
$$;

revoke all on function
  public.finalize_media_publication(
    uuid,
    uuid,
    text,
    text
  )
  from public;
grant execute on function
  public.finalize_media_publication(
    uuid,
    uuid,
    text,
    text
  )
  to service_role;

create or replace function public.protect_published_media_asset()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  old_content jsonb;
  new_content jsonb;
  internal_finalization boolean :=
    coalesce(
      current_setting(
        'pronouncelab.media_finalization',
        true
      ),
      ''
    ) = 'on';
begin
  perform public.lock_content_hierarchy_gate();
  perform public.lock_media_gate();

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

  if (
    new.publication_token is distinct from
      old.publication_token
    or new.source_storage_object_id is distinct from
      old.source_storage_object_id
    or new.source_storage_object_version is distinct from
      old.source_storage_object_version
    or new.publication_requested_by is distinct from
      old.publication_requested_by
    or new.publication_prepared_at is distinct from
      old.publication_prepared_at
    or new.publication_expires_at is distinct from
      old.publication_expires_at
    or new.publication_completed_at is distinct from
      old.publication_completed_at
    or new.source_sha256 is distinct from
      old.source_sha256
    or new.published_sha256 is distinct from
      old.published_sha256
  )
    and not internal_finalization
  then
    raise exception
      'Media publication state may only be changed by publication RPCs';
  end if;

  if old.status = 'draft'
    and old.publication_token is not null
    and not internal_finalization
    and (
      to_jsonb(new) - 'updated_at'
    ) is distinct from (
      to_jsonb(old) - 'updated_at'
    )
  then
    raise exception
      'Prepared media metadata is sealed until publication is finalized';
  end if;

  if old.status = 'draft'
    and new.status = 'published'
  then
    if not internal_finalization then
      raise exception
        'Draft media must be published through finalization';
    end if;

    if not (
      (
        old.bucket = 'content-audio-drafts'
        and new.bucket = 'content-audio'
      )
      or (
        old.bucket = 'content-image-drafts'
        and new.bucket = 'content-images'
      )
    )
      or new.object_path is distinct from
        old.object_path
    then
      raise exception
        'Media publication requires the corresponding public object';
    end if;

    old_content :=
      to_jsonb(old) - array[
        'bucket',
        'status',
        'published_by',
        'published_at',
        'updated_at',
        'publication_completed_at',
        'source_sha256',
        'published_sha256'
      ];
    new_content :=
      to_jsonb(new) - array[
        'bucket',
        'status',
        'published_by',
        'published_at',
        'updated_at',
        'publication_completed_at',
        'source_sha256',
        'published_sha256'
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

    if old.status = 'published'
      and new.status <> 'published'
      and (
        exists (
          select 1
          from public.theory_blocks as theory
          join public.lesson_activities as activity
            on activity.id = theory.activity_id
          join public.lesson_versions as version
            on version.id =
              activity.lesson_version_id
          where theory.media_asset_id = old.id
            and version.status = 'published'
        )
        or exists (
          select 1
          from public.listening_items as listening
          join public.lesson_activities as activity
            on activity.id = listening.activity_id
          join public.lesson_versions as version
            on version.id =
              activity.lesson_version_id
          where listening.audio_asset_id = old.id
            and version.status = 'published'
        )
        or exists (
          select 1
          from public.pronunciation_items as pronunciation
          join public.lesson_activities as activity
            on activity.id =
              pronunciation.activity_id
          join public.lesson_versions as version
            on version.id =
              activity.lesson_version_id
          where pronunciation.audio_asset_id =
              old.id
            and version.status = 'published'
        )
      )
    then
      raise exception
        'Media referenced by a published lesson version must remain published';
    end if;

    old_content := to_jsonb(old)
      - array['status', 'updated_at'];
    new_content := to_jsonb(new)
      - array['status', 'updated_at'];

    if new_content is distinct from old_content then
      raise exception
        'Published or retired media asset metadata is immutable';
    end if;
  end if;

  return new;
end;
$$;

-- Storage deletion and media lifecycle changes take the same gate. Public
-- objects are immutable, and referenced public objects cannot be deleted.
create or replace function public.protect_published_storage_object()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.lock_media_gate();

  if tg_op = 'UPDATE'
    and (
      old.bucket_id in (
        'content-audio',
        'content-images'
      )
      or new.bucket_id in (
        'content-audio',
        'content-images'
      )
    )
  then
    raise exception
      'Published Storage objects cannot be updated or moved in place';
  end if;

  if tg_op = 'DELETE'
    and old.bucket_id in (
      'content-audio',
      'content-images'
    )
    and exists (
      select 1
      from public.media_assets as asset
      where asset.bucket = old.bucket_id
        and asset.object_path = old.name
        and asset.status in (
          'published',
          'unpublished',
          'archived'
        )
      for update
    )
  then
    raise exception
      'Published Storage object is referenced by sealed media metadata';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

-- Validate all reachable media while holding the hierarchy gate, media gate,
-- every descendant row, each media row, and each public Storage object.
create or replace function public.validate_lesson_version_media(
  requested_lesson_version_id bigint
)
returns void
language plpgsql
set search_path = ''
as $$
declare
  invalid_category text;
  referenced_asset record;
begin
  perform public.lock_content_hierarchy_gate();
  perform public.lock_media_gate();

  perform 1
  from public.lesson_activities as activity
  where activity.lesson_version_id =
    requested_lesson_version_id
  order by activity.id
  for update;

  perform 1
  from public.theory_blocks as theory
  join public.lesson_activities as activity
    on activity.id = theory.activity_id
  where activity.lesson_version_id =
    requested_lesson_version_id
  order by theory.id
  for update of theory;

  perform 1
  from public.listening_items as listening
  join public.lesson_activities as activity
    on activity.id = listening.activity_id
  where activity.lesson_version_id =
    requested_lesson_version_id
  order by listening.id
  for update of listening;

  perform 1
  from public.pronunciation_items as pronunciation
  join public.lesson_activities as activity
    on activity.id = pronunciation.activity_id
  where activity.lesson_version_id =
    requested_lesson_version_id
  order by pronunciation.id
  for update of pronunciation;

  perform 1
  from public.assessment_sets as assessment
  join public.lesson_activities as activity
    on activity.id = assessment.activity_id
  where activity.lesson_version_id =
    requested_lesson_version_id
  order by assessment.id
  for update of assessment;

  perform 1
  from public.questions as question
  join public.assessment_sets as assessment
    on assessment.id = question.assessment_set_id
  join public.lesson_activities as activity
    on activity.id = assessment.activity_id
  where activity.lesson_version_id =
    requested_lesson_version_id
  order by question.id
  for update of question;

  perform 1
  from public.question_options as option
  join public.questions as question
    on question.id = option.question_id
  join public.assessment_sets as assessment
    on assessment.id = question.assessment_set_id
  join public.lesson_activities as activity
    on activity.id = assessment.activity_id
  where activity.lesson_version_id =
    requested_lesson_version_id
  order by option.id
  for update of option;

  if exists (
    select 1
    from public.assessment_sets as assessment
    join public.lesson_activities as activity
      on activity.id = assessment.activity_id
    left join public.listening_items as listening
      on listening.id = assessment.listening_item_id
      and listening.activity_id = assessment.activity_id
    where activity.lesson_version_id =
      requested_lesson_version_id
      and assessment.listening_item_id is not null
      and listening.id is null
  )
  then
    raise exception
      'Invalid publication reference: assessment listening hierarchy';
  end if;

  for referenced_asset in
    with referenced_rows as (
      select 'theory media'::text as category,
        theory.media_asset_id as asset_id
      from public.theory_blocks as theory
      join public.lesson_activities as activity
        on activity.id = theory.activity_id
      where activity.lesson_version_id =
        requested_lesson_version_id
        and theory.media_asset_id is not null
      union all
      select 'listening audio',
        listening.audio_asset_id
      from public.listening_items as listening
      join public.lesson_activities as activity
        on activity.id = listening.activity_id
      where activity.lesson_version_id =
        requested_lesson_version_id
        and listening.audio_asset_id is not null
      union all
      select 'pronunciation audio',
        pronunciation.audio_asset_id
      from public.pronunciation_items as pronunciation
      join public.lesson_activities as activity
        on activity.id = pronunciation.activity_id
      where activity.lesson_version_id =
        requested_lesson_version_id
        and pronunciation.audio_asset_id is not null
      union all
      select 'assessment listening audio',
        listening.audio_asset_id
      from public.assessment_sets as assessment
      join public.lesson_activities as activity
        on activity.id = assessment.activity_id
      join public.listening_items as listening
        on listening.id = assessment.listening_item_id
        and listening.activity_id =
          assessment.activity_id
      where activity.lesson_version_id =
        requested_lesson_version_id
        and listening.audio_asset_id is not null
    )
    select reference.category,
      asset.id,
      asset.status,
      asset.bucket,
      asset.object_path,
      asset.kind
    from referenced_rows as reference
    join public.media_assets as asset
      on asset.id = reference.asset_id
    order by reference.asset_id, reference.category
    for update of asset
  loop
    if referenced_asset.id is null
      or referenced_asset.status <> 'published'
      or (
        referenced_asset.kind = 'audio'
        and referenced_asset.bucket <>
          'content-audio'
      )
      or (
        referenced_asset.kind = 'image'
        and referenced_asset.bucket <>
          'content-images'
      )
    then
      invalid_category := referenced_asset.category;
      raise exception
        'Invalid publication media reference: %',
        invalid_category;
    end if;

    perform 1
    from storage.objects as storage_object
    where storage_object.bucket_id =
        referenced_asset.bucket
      and storage_object.name =
        referenced_asset.object_path
    for share;

    if not found then
      raise exception
        'Missing public Storage object for: %',
        referenced_asset.category;
    end if;
  end loop;
end;
$$;

revoke all on function
  public.validate_lesson_version_media(bigint)
  from public;

-- Direct lifecycle publication is forbidden. Publication must begin by taking
-- the hierarchy gate in the RPC command before any later row lock, validation,
-- or lifecycle UPDATE command obtains its READ COMMITTED snapshot.
drop policy if exists "lesson_versions_publish"
  on public.lesson_versions;

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

  -- Statement 1: wait for every earlier descendant mutation to finish.
  perform public.lock_content_hierarchy_gate();

  -- Statement 2: use a later command snapshot and lock the lifecycle row.
  select *
  into version_row
  from public.lesson_versions
  where id = requested_lesson_version_id
  for update;

  if not found then
    raise exception
      'Lesson version does not exist';
  end if;

  if version_row.status <> 'draft' then
    raise exception
      'Only a draft lesson version can be published';
  end if;

  -- Statement 3+: re-read and lock the complete hierarchy, referenced media,
  -- and Storage objects after any gate wait has completed.
  perform public.validate_lesson_version_media(
    version_row.id
  );

  -- This transaction-local capability is set only inside the non-PUBLIC,
  -- SECURITY DEFINER RPC and is consumed by the protection trigger below.
  perform pg_catalog.set_config(
    'pronouncelab.lesson_publication',
    'on',
    true
  );

  -- Final later statement: server controls status and audit values.
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

create or replace function public.protect_published_lesson_version()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  old_content jsonb;
  new_content jsonb;
  internal_publication boolean :=
    coalesce(
      current_setting(
        'pronouncelab.lesson_publication',
        true
      ),
      ''
    ) = 'on';
begin
  perform public.lock_content_hierarchy_gate();

  if old.status = 'draft'
    and new.status = 'published'
  then
    if not internal_publication then
      raise exception
        'Lesson versions must be published through the publication RPC';
    end if;

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
  perform public.lock_content_hierarchy_gate();

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

commit;
