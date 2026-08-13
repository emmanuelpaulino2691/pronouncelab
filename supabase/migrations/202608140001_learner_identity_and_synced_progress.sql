begin;

create table public.learner_lesson_progress (
  learner_id uuid not null references auth.users(id) on delete cascade,
  lesson_id bigint not null references public.lessons(id) on delete cascade,
  started_at timestamptz not null default pg_catalog.now(),
  completed_at timestamptz,
  last_activity_id bigint references public.lesson_activities(id) on delete set null,
  last_accessed_at timestamptz not null default pg_catalog.now(),
  primary key (learner_id, lesson_id),
  constraint learner_lesson_progress_completion_after_start
    check (completed_at is null or completed_at >= started_at)
);

create table public.learner_activity_progress (
  learner_id uuid not null references auth.users(id) on delete cascade,
  activity_id bigint not null references public.lesson_activities(id) on delete cascade,
  completed_at timestamptz not null default pg_catalog.now(),
  primary key (learner_id, activity_id)
);

create index learner_lesson_progress_recent_idx
  on public.learner_lesson_progress (learner_id, last_accessed_at desc);

alter table public.learner_lesson_progress enable row level security;
alter table public.learner_activity_progress enable row level security;

grant select on public.learner_lesson_progress, public.learner_activity_progress
  to authenticated;

create policy "learner_lesson_progress_select_own_or_admin"
on public.learner_lesson_progress for select to authenticated
using (learner_id = auth.uid() or public.has_admin_role('admin'));

create policy "learner_activity_progress_select_own_or_admin"
on public.learner_activity_progress for select to authenticated
using (learner_id = auth.uid() or public.has_admin_role('admin'));

create or replace function public.is_learner_identity()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
    and not exists (
      select 1 from public.user_roles role where role.user_id = auth.uid()
    );
$$;

create or replace function public.learner_lesson_is_eligible(
  requested_learner_id uuid,
  requested_lesson_id bigint
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.lessons target_lesson
    join public.units target_unit on target_unit.id = target_lesson.unit_id
    join public.courses target_course on target_course.id = target_unit.course_id
    where target_lesson.id = requested_lesson_id
      and target_lesson.status = 'published'
      and target_lesson.current_published_version_id is not null
      and target_unit.status = 'published'
      and target_course.status = 'published'
      and not exists (
        select 1
        from public.lessons prerequisite_lesson
        join public.units prerequisite_unit on prerequisite_unit.id = prerequisite_lesson.unit_id
        where prerequisite_unit.course_id = target_course.id
          and prerequisite_unit.status = 'published'
          and prerequisite_lesson.status = 'published'
          and prerequisite_lesson.current_published_version_id is not null
          and (
            prerequisite_unit.position < target_unit.position
            or (
              prerequisite_unit.id = target_unit.id
              and prerequisite_lesson.position < target_lesson.position
            )
          )
          and exists (
            select 1 from public.lesson_activities activity
            where activity.lesson_version_id = prerequisite_lesson.current_published_version_id
          )
          and not exists (
            select 1 from public.learner_lesson_progress progress
            where progress.learner_id = requested_learner_id
              and progress.lesson_id = prerequisite_lesson.id
              and progress.completed_at is not null
          )
      )
  );
$$;

create or replace function public.record_learner_lesson_visit(
  requested_lesson_id bigint,
  requested_activity_id bigint default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  learner uuid := auth.uid();
begin
  if learner is null or not public.is_learner_identity() then
    raise exception 'Learner authentication is required';
  end if;

  if not exists (
    select 1
    from public.lessons lesson
    join public.units unit on unit.id = lesson.unit_id
    join public.courses course on course.id = unit.course_id
    join public.lesson_versions version on version.id = lesson.current_published_version_id
    where lesson.id = requested_lesson_id
      and lesson.status = 'published'
      and unit.status = 'published'
      and course.status = 'published'
      and version.status = 'published'
      and (requested_activity_id is null or exists (
        select 1 from public.lesson_activities activity
        where activity.id = requested_activity_id
          and activity.lesson_version_id = version.id
      ))
  ) then
    raise exception 'Published learner lesson is unavailable';
  end if;
  if not public.learner_lesson_is_eligible(learner, requested_lesson_id) then
    raise exception 'Complete the previous learning content first';
  end if;

  insert into public.learner_lesson_progress (
    learner_id, lesson_id, last_activity_id, last_accessed_at
  ) values (
    learner, requested_lesson_id, requested_activity_id, pg_catalog.now()
  )
  on conflict (learner_id, lesson_id) do update
  set last_activity_id = coalesce(excluded.last_activity_id, public.learner_lesson_progress.last_activity_id),
      last_accessed_at = excluded.last_accessed_at;
end;
$$;

create or replace function public.record_learner_activity_completion(
  requested_activity_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  learner uuid := auth.uid();
  target_lesson_id bigint;
  target_version_id bigint;
  completed_at_value timestamptz;
  lesson_complete boolean;
begin
  if learner is null or not public.is_learner_identity() then
    raise exception 'Learner authentication is required';
  end if;

  select lesson.id, version.id
  into target_lesson_id, target_version_id
  from public.lesson_activities activity
  join public.lesson_versions version on version.id = activity.lesson_version_id
  join public.lessons lesson on lesson.id = version.lesson_id
  join public.units unit on unit.id = lesson.unit_id
  join public.courses course on course.id = unit.course_id
  where activity.id = requested_activity_id
    and version.status = 'published'
    and lesson.status = 'published'
    and lesson.current_published_version_id = version.id
    and unit.status = 'published'
    and course.status = 'published';

  if target_lesson_id is null then
    raise exception 'Published learner activity is unavailable';
  end if;
  if not public.learner_lesson_is_eligible(learner, target_lesson_id) then
    raise exception 'Complete the previous learning content first';
  end if;

  insert into public.learner_activity_progress (learner_id, activity_id)
  values (learner, requested_activity_id)
  on conflict (learner_id, activity_id) do update
  set completed_at = public.learner_activity_progress.completed_at
  returning completed_at into completed_at_value;

  select not exists (
    select 1
    from public.lesson_activities activity
    where activity.lesson_version_id = target_version_id
      and not exists (
        select 1 from public.learner_activity_progress progress
        where progress.learner_id = learner
          and progress.activity_id = activity.id
      )
  ) into lesson_complete;

  insert into public.learner_lesson_progress (
    learner_id, lesson_id, completed_at, last_activity_id, last_accessed_at
  ) values (
    learner, target_lesson_id,
    case when lesson_complete then completed_at_value else null end,
    requested_activity_id, pg_catalog.now()
  )
  on conflict (learner_id, lesson_id) do update
  set completed_at = coalesce(
        public.learner_lesson_progress.completed_at,
        excluded.completed_at
      ),
      last_activity_id = excluded.last_activity_id,
      last_accessed_at = excluded.last_accessed_at;

  return jsonb_build_object(
    'activityId', requested_activity_id,
    'lessonId', target_lesson_id,
    'completedAt', completed_at_value,
    'lessonComplete', lesson_complete
  );
end;
$$;

create or replace function public.get_my_learner_progress()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  learner uuid := auth.uid();
begin
  if learner is null or not public.is_learner_identity() then
    raise exception 'Learner authentication is required';
  end if;

  return jsonb_build_object(
    'lessons', coalesce((
      select jsonb_agg(jsonb_build_object(
        'lessonId', progress.lesson_id,
        'startedAt', progress.started_at,
        'completedAt', progress.completed_at,
        'lastActivityId', progress.last_activity_id,
        'lastAccessedAt', progress.last_accessed_at
      ) order by progress.last_accessed_at, progress.lesson_id)
      from public.learner_lesson_progress progress
      join public.lessons lesson on lesson.id = progress.lesson_id
      join public.units unit on unit.id = lesson.unit_id
      join public.courses course on course.id = unit.course_id
      where progress.learner_id = learner
        and lesson.status = 'published'
        and unit.status = 'published'
        and course.status = 'published'
    ), '[]'::jsonb),
    'activities', coalesce((
      select jsonb_agg(jsonb_build_object(
        'activityId', activity.id,
        'lessonId', lesson.id,
        'position', activity.position,
        'completedAt', progress.completed_at
      ) order by progress.completed_at, activity.id)
      from public.learner_activity_progress progress
      join public.lesson_activities activity on activity.id = progress.activity_id
      join public.lesson_versions version on version.id = activity.lesson_version_id
      join public.lessons lesson on lesson.id = version.lesson_id
      join public.units unit on unit.id = lesson.unit_id
      join public.courses course on course.id = unit.course_id
      where progress.learner_id = learner
        and version.status = 'published'
        and lesson.status = 'published'
        and lesson.current_published_version_id = version.id
        and unit.status = 'published'
        and course.status = 'published'
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.is_learner_identity() from public, anon;
revoke all on function public.learner_lesson_is_eligible(uuid,bigint) from public, anon, authenticated;
revoke all on function public.record_learner_lesson_visit(bigint,bigint) from public, anon;
revoke all on function public.record_learner_activity_completion(bigint) from public, anon;
revoke all on function public.get_my_learner_progress() from public, anon;
grant execute on function public.is_learner_identity() to authenticated;
grant execute on function public.record_learner_lesson_visit(bigint,bigint) to authenticated;
grant execute on function public.record_learner_activity_completion(bigint) to authenticated;
grant execute on function public.get_my_learner_progress() to authenticated;

commit;
