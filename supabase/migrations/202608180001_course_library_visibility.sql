begin;

create type public.course_learner_visibility as enum ('class_only', 'unlisted', 'public');

alter table public.courses
  add column learner_visibility public.course_learner_visibility not null default 'class_only',
  add column learner_visibility_updated_at timestamptz not null default pg_catalog.now();

create or replace function public.protect_publishable_content()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  old_content jsonb;
  new_content jsonb;
  publishable_fields text[] := array[
    'status', 'published_at', 'updated_at', 'updated_by'
  ];
  sealed_fields text[] := array[
    'status', 'updated_at', 'updated_by'
  ];
begin
  if tg_op = 'DELETE' then
    if old.status in ('published', 'unpublished', 'archived') then
      raise exception 'Published or retired % records are immutable', tg_table_name;
    end if;
    return old;
  end if;

  if tg_table_name = 'lessons' then
    publishable_fields := publishable_fields || array['current_published_version_id'];
    sealed_fields := sealed_fields || array['current_published_version_id'];
  elsif tg_table_name = 'courses' then
    publishable_fields := publishable_fields || array[
      'learner_visibility', 'learner_visibility_updated_at'
    ];
    sealed_fields := sealed_fields || array[
      'learner_visibility', 'learner_visibility_updated_at'
    ];
  end if;

  if old.status = 'draft' and new.status = 'published' then
    old_content := to_jsonb(old) - publishable_fields;
    new_content := to_jsonb(new) - publishable_fields;
    if new_content is distinct from old_content then
      raise exception 'Publishing cannot rewrite % content', tg_table_name;
    end if;
  end if;

  if old.status in ('published', 'unpublished', 'archived') then
    if new.status = 'draft'
      or (old.status = 'archived' and new.status <> 'archived')
    then
      raise exception 'Invalid lifecycle transition for sealed % record', tg_table_name;
    end if;

    old_content := to_jsonb(old) - sealed_fields;
    new_content := to_jsonb(new) - sealed_fields;
    if new_content is distinct from old_content then
      raise exception 'Published or retired % records are immutable', tg_table_name;
    end if;
  end if;

  return new;
end;
$$;

create table public.course_unlisted_share_links (
  course_id bigint primary key references public.courses(id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default pg_catalog.now(),
  created_by uuid not null references auth.users(id) on delete restrict
);

create table public.learner_independent_course_access (
  learner_id uuid not null references auth.users(id) on delete cascade,
  course_id bigint not null references public.courses(id) on delete cascade,
  granted_at timestamptz not null default pg_catalog.now(),
  primary key (learner_id, course_id)
);

alter table public.course_unlisted_share_links enable row level security;
alter table public.learner_independent_course_access enable row level security;
grant select on public.learner_independent_course_access to authenticated;

create policy learner_independent_course_access_select_own
on public.learner_independent_course_access for select to authenticated
using (learner_id = auth.uid());

create or replace function public.guard_course_learner_visibility()
returns trigger language plpgsql set search_path='' as $$
begin
  if new.learner_visibility is distinct from old.learner_visibility and current_user not in ('postgres','service_role') then
    raise exception 'Course learner visibility must use the controlled workflow';
  end if;
  return new;
end;$$;
create trigger guard_course_learner_visibility
before update of learner_visibility on public.courses
for each row execute function public.guard_course_learner_visibility();

create or replace function public.can_access_current_course(
  requested_course_id bigint,
  requested_learner_id uuid default auth.uid()
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
      and course.status = 'published'
      and (
        course.learner_visibility = 'public'
        or (
          course.learner_visibility = 'unlisted'
          and requested_learner_id is not null
          and exists (
            select 1
            from public.learner_independent_course_access access
            where access.course_id = course.id
              and access.learner_id = requested_learner_id
          )
        )
      )
  );
$$;

create or replace function public.set_course_learner_visibility(
  requested_course_id bigint,
  requested_visibility public.course_learner_visibility
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  previous_visibility public.course_learner_visibility;
  generated_token text;
begin
  if not (public.is_course_owner(requested_course_id) or public.is_platform_admin()) then
    raise exception 'Course visibility is unavailable';
  end if;

  select learner_visibility into previous_visibility
  from public.courses where id = requested_course_id for update;
  if previous_visibility is null then raise exception 'Course is unavailable'; end if;

  update public.courses
  set learner_visibility = requested_visibility,
      learner_visibility_updated_at = pg_catalog.now()
  where id = requested_course_id;

  if requested_visibility <> 'unlisted' then
    delete from public.course_unlisted_share_links where course_id = requested_course_id;
    delete from public.learner_independent_course_access where course_id = requested_course_id;
  elsif previous_visibility <> 'unlisted' then
    generated_token := encode(extensions.gen_random_bytes(32), 'hex');
    insert into public.course_unlisted_share_links(course_id, token_hash, created_by)
    values (requested_course_id, encode(extensions.digest(pg_catalog.convert_to(generated_token,'UTF8'),'sha256'),'hex'), auth.uid())
    on conflict (course_id) do update
      set token_hash = excluded.token_hash, created_at = pg_catalog.now(), created_by = excluded.created_by;
  end if;

  return pg_catalog.jsonb_build_object(
    'courseId', requested_course_id,
    'visibility', requested_visibility,
    'shareToken', generated_token
  );
end;
$$;

create or replace function public.regenerate_course_unlisted_share_link(requested_course_id bigint)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare generated_token text;
begin
  if not (public.is_course_owner(requested_course_id) or public.is_platform_admin())
    or not exists (select 1 from public.courses where id=requested_course_id and learner_visibility='unlisted') then
    raise exception 'Unlisted Course link is unavailable';
  end if;
  generated_token := encode(extensions.gen_random_bytes(32), 'hex');
  insert into public.course_unlisted_share_links(course_id,token_hash,created_by)
  values(requested_course_id,encode(extensions.digest(pg_catalog.convert_to(generated_token,'UTF8'),'sha256'),'hex'),auth.uid())
  on conflict(course_id) do update set token_hash=excluded.token_hash,created_at=pg_catalog.now(),created_by=excluded.created_by;
  return generated_token;
end;
$$;

create or replace function public.redeem_unlisted_course_link(requested_token text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare target_course_id bigint;
begin
  if not public.is_learner_identity() then raise exception 'Learner sign-in is required'; end if;
  select course.id into target_course_id
  from public.course_unlisted_share_links link
  join public.courses course on course.id=link.course_id
  where course.status='published' and course.learner_visibility='unlisted'
    and link.token_hash=encode(extensions.digest(pg_catalog.convert_to(btrim(coalesce(requested_token,'')),'UTF8'),'sha256'),'hex');
  if target_course_id is null then raise exception 'This shared Course link is invalid or no longer available'; end if;
  insert into public.learner_independent_course_access(learner_id,course_id)
  values(auth.uid(),target_course_id) on conflict do nothing;
  return target_course_id;
end;
$$;

drop policy if exists courses_select_published_or_owned on public.courses;
create policy courses_select_public_or_owned
on public.courses for select to anon, authenticated
using (
  (status='published' and learner_visibility='public')
  or public.can_view_all_courses()
  or (public.is_content_teacher() and owner_user_id=auth.uid())
);

alter function public.get_published_learning_catalog(integer)
  rename to get_published_learning_catalog_before_visibility;
revoke all on function public.get_published_learning_catalog_before_visibility(integer)
  from public, anon, authenticated, service_role;

create or replace function public.get_published_learning_catalog(requested_schema_version integer)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare base jsonb; visible_courses jsonb;
begin
  base := public.get_published_learning_catalog_before_visibility(requested_schema_version);
  if base ? 'error' then return base; end if;
  select coalesce(pg_catalog.jsonb_agg(projected.course_payload || pg_catalog.jsonb_build_object('visibility',course.learner_visibility) order by projected.ordinal),'[]'::jsonb)
  into visible_courses
  from pg_catalog.jsonb_array_elements(coalesce(base->'courses','[]'::jsonb)) with ordinality projected(course_payload,ordinal)
  join public.courses course on course.id=(projected.course_payload->>'id')::bigint
  where public.can_access_current_course(course.id);
  return pg_catalog.jsonb_set(
    pg_catalog.jsonb_set(base,'{courses}',visible_courses,true),
    '{catalogRevision}',
    pg_catalog.to_jsonb(pg_catalog.md5(coalesce(base->>'catalogRevision','') || ':' || visible_courses::text)),true
  );
end;
$$;

alter function public.get_published_lesson(bigint,integer)
  rename to get_published_lesson_before_visibility;
revoke all on function public.get_published_lesson_before_visibility(bigint,integer)
  from public, anon, authenticated, service_role;

create or replace function public.get_published_lesson(requested_lesson_id bigint,requested_schema_version integer)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare course_id_value bigint;
begin
  select unit.course_id into course_id_value
  from public.lessons lesson join public.units unit on unit.id=lesson.unit_id
  where lesson.id=requested_lesson_id;
  if course_id_value is not null and public.can_access_current_course(course_id_value) then
    return public.get_published_lesson_before_visibility(requested_lesson_id,requested_schema_version);
  end if;
  return pg_catalog.jsonb_build_object('schemaVersion',1,'lessonRevision','not-found','generatedAt',pg_catalog.to_char(pg_catalog.statement_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'lesson',null);
end;
$$;

create or replace function public.learner_lesson_is_eligible(requested_learner_id uuid,requested_lesson_id bigint)
returns boolean language sql stable security definer set search_path='' as $$
  select exists (
    select 1 from public.lessons target_lesson
    join public.units target_unit on target_unit.id=target_lesson.unit_id
    join public.courses target_course on target_course.id=target_unit.course_id
    where target_lesson.id=requested_lesson_id and target_lesson.status='published'
      and target_lesson.current_published_version_id is not null and target_unit.status='published'
      and public.can_access_current_course(target_course.id,requested_learner_id)
      and not exists (
        select 1 from public.lessons prerequisite_lesson
        join public.units prerequisite_unit on prerequisite_unit.id=prerequisite_lesson.unit_id
        where prerequisite_unit.course_id=target_course.id and prerequisite_unit.status='published'
          and prerequisite_lesson.status='published' and prerequisite_lesson.current_published_version_id is not null
          and (prerequisite_unit.position<target_unit.position or (prerequisite_unit.id=target_unit.id and prerequisite_lesson.position<target_lesson.position))
          and exists(select 1 from public.lesson_activities activity where activity.lesson_version_id=prerequisite_lesson.current_published_version_id)
          and not exists(select 1 from public.learner_lesson_progress progress where progress.learner_id=requested_learner_id and progress.lesson_id=prerequisite_lesson.id and progress.completed_at is not null)
      )
  );
$$;

create or replace function public.record_learner_lesson_visit(requested_lesson_id bigint,requested_activity_id bigint default null)
returns void language plpgsql security definer set search_path='' as $$
declare learner uuid:=auth.uid();
begin
  if learner is null or not public.is_learner_identity() then raise exception 'Learner authentication is required'; end if;
  if not exists(select 1 from public.lessons lesson join public.units unit on unit.id=lesson.unit_id join public.courses course on course.id=unit.course_id join public.lesson_versions version on version.id=lesson.current_published_version_id where lesson.id=requested_lesson_id and lesson.status='published' and unit.status='published' and version.status='published' and public.can_access_current_course(course.id,learner) and (requested_activity_id is null or exists(select 1 from public.lesson_activities activity where activity.id=requested_activity_id and activity.lesson_version_id=version.id))) then raise exception 'Published learner lesson is unavailable'; end if;
  if not public.learner_lesson_is_eligible(learner,requested_lesson_id) then raise exception 'Complete the previous learning content first'; end if;
  insert into public.learner_lesson_progress(learner_id,lesson_id,last_activity_id,last_accessed_at) values(learner,requested_lesson_id,requested_activity_id,pg_catalog.now())
  on conflict(learner_id,lesson_id) do update set last_activity_id=coalesce(excluded.last_activity_id,public.learner_lesson_progress.last_activity_id),last_accessed_at=excluded.last_accessed_at;
end;
$$;

create or replace function public.record_learner_activity_completion(requested_activity_id bigint)
returns jsonb language plpgsql security definer set search_path='' as $$
declare learner uuid:=auth.uid();target_lesson_id bigint;target_version_id bigint;completed_at_value timestamptz;lesson_complete boolean;
begin
  if learner is null or not public.is_learner_identity() then raise exception 'Learner authentication is required'; end if;
  select lesson.id,version.id into target_lesson_id,target_version_id from public.lesson_activities activity join public.lesson_versions version on version.id=activity.lesson_version_id join public.lessons lesson on lesson.id=version.lesson_id join public.units unit on unit.id=lesson.unit_id join public.courses course on course.id=unit.course_id where activity.id=requested_activity_id and version.status='published' and lesson.status='published' and lesson.current_published_version_id=version.id and unit.status='published' and public.can_access_current_course(course.id,learner);
  if target_lesson_id is null then raise exception 'Published learner activity is unavailable'; end if;
  if not public.learner_lesson_is_eligible(learner,target_lesson_id) then raise exception 'Complete the previous learning content first'; end if;
  insert into public.learner_activity_progress(learner_id,activity_id) values(learner,requested_activity_id) on conflict(learner_id,activity_id) do update set completed_at=public.learner_activity_progress.completed_at returning completed_at into completed_at_value;
  select not exists(select 1 from public.lesson_activities activity where activity.lesson_version_id=target_version_id and not exists(select 1 from public.learner_activity_progress progress where progress.learner_id=learner and progress.activity_id=activity.id)) into lesson_complete;
  insert into public.learner_lesson_progress(learner_id,lesson_id,completed_at,last_activity_id,last_accessed_at) values(learner,target_lesson_id,case when lesson_complete then completed_at_value else null end,requested_activity_id,pg_catalog.now()) on conflict(learner_id,lesson_id) do update set completed_at=coalesce(public.learner_lesson_progress.completed_at,excluded.completed_at),last_activity_id=excluded.last_activity_id,last_accessed_at=excluded.last_accessed_at;
  return pg_catalog.jsonb_build_object('activityId',requested_activity_id,'lessonId',target_lesson_id,'completedAt',completed_at_value,'lessonComplete',lesson_complete);
end;
$$;

create or replace function public.get_my_learner_progress()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare learner uuid:=auth.uid();
begin
  if learner is null or not public.is_learner_identity() then raise exception 'Learner authentication is required'; end if;
  return pg_catalog.jsonb_build_object(
    'lessons',coalesce((select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('lessonId',progress.lesson_id,'startedAt',progress.started_at,'completedAt',progress.completed_at,'lastActivityId',progress.last_activity_id,'lastAccessedAt',progress.last_accessed_at) order by progress.last_accessed_at,progress.lesson_id) from public.learner_lesson_progress progress join public.lessons lesson on lesson.id=progress.lesson_id join public.units unit on unit.id=lesson.unit_id where progress.learner_id=learner and lesson.status='published' and unit.status='published' and public.can_access_current_course(unit.course_id,learner)),'[]'::jsonb),
    'activities',coalesce((select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('activityId',activity.id,'lessonId',lesson.id,'position',activity.position,'completedAt',progress.completed_at) order by progress.completed_at,activity.id) from public.learner_activity_progress progress join public.lesson_activities activity on activity.id=progress.activity_id join public.lesson_versions version on version.id=activity.lesson_version_id join public.lessons lesson on lesson.id=version.lesson_id join public.units unit on unit.id=lesson.unit_id where progress.learner_id=learner and version.status='published' and lesson.status='published' and lesson.current_published_version_id=version.id and unit.status='published' and public.can_access_current_course(unit.course_id,learner)),'[]'::jsonb)
  );
end;
$$;

revoke all on table public.course_unlisted_share_links from public,anon,authenticated;
revoke all on table public.learner_independent_course_access from public,anon;
revoke all on function public.can_access_current_course(bigint,uuid) from public,anon,authenticated;
grant execute on function public.can_access_current_course(bigint,uuid) to authenticated;
revoke all on function public.set_course_learner_visibility(bigint,public.course_learner_visibility),public.regenerate_course_unlisted_share_link(bigint),public.redeem_unlisted_course_link(text) from public,anon;
grant execute on function public.set_course_learner_visibility(bigint,public.course_learner_visibility),public.regenerate_course_unlisted_share_link(bigint),public.redeem_unlisted_course_link(text) to authenticated;
revoke all on function public.get_published_learning_catalog(integer),public.get_published_lesson(bigint,integer) from public;
grant execute on function public.get_published_learning_catalog(integer),public.get_published_lesson(bigint,integer) to anon,authenticated;
grant execute on function public.get_published_learning_catalog(integer) to service_role;

comment on column public.courses.learner_visibility is 'Independent-practice discoverability; does not affect publication, Releases, or Class assignments.';
comment on table public.course_unlisted_share_links is 'SHA-256 digests for revocable authenticated-learner Unlisted share links.';
comment on table public.learner_independent_course_access is 'Learner-scoped redemption grants for current Unlisted Course practice.';

commit;
