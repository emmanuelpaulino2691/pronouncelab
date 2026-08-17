begin;

alter table public.classes add column if not exists timezone text not null default 'UTC';

alter table public.class_course_assignments
  add column if not exists available_at timestamptz,
  add column if not exists due_at timestamptz;

alter table public.class_course_assignments add constraint class_assignments_schedule_valid
  check (due_at is null or available_at is null or due_at > available_at);
create index if not exists class_course_assignments_schedule_idx
  on public.class_course_assignments(status, available_at, due_at);

create or replace function public.update_owned_class(
  requested_class_id bigint,
  requested_name text,
  requested_description text,
  requested_status public.class_status,
  requested_timezone text
) returns void language plpgsql security definer set search_path='' as $$
begin
  if not exists (select 1 from pg_catalog.pg_timezone_names where name=requested_timezone) then
    raise exception using errcode='22023', message='A valid Class timezone is required';
  end if;
  update public.classes set name=btrim(requested_name), description=btrim(coalesce(requested_description,'')),
    status=requested_status, timezone=requested_timezone,
    join_code_enabled=case when requested_status='archived' then false else join_code_enabled end,
    updated_at=pg_catalog.now()
  where id=requested_class_id and (owner_user_id=auth.uid() or public.is_platform_admin());
  if not found then raise exception 'Class is unavailable'; end if;
end; $$;

create or replace function public.update_owned_class(
  requested_class_id bigint,
  requested_name text,
  requested_description text,
  requested_status public.class_status
) returns void language plpgsql security definer set search_path='' as $$
begin
  perform public.update_owned_class(requested_class_id, requested_name, requested_description, requested_status, 'UTC');
end; $$;

create or replace function public.can_access_course_release(requested_release_id bigint)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.course_releases r where r.id=requested_release_id and
    (r.owner_user_id=auth.uid() or public.is_platform_admin()))
    or (public.is_learner_identity() and (
      exists(select 1 from public.course_release_learner_entitlements e where e.course_release_id=requested_release_id and e.learner_id=auth.uid())
      or exists(
        select 1 from public.class_course_assignments a
        join public.classes c on c.id=a.class_id and c.status='active'
        join public.class_enrollments e on e.class_id=c.id and e.status='active'
        where a.course_release_id=requested_release_id and a.status='active'
          and e.learner_user_id=auth.uid()
          and (a.available_at is null or a.available_at <= pg_catalog.now())
      )
    ));
$$;

create or replace function public.assign_class_course_release(
  requested_class_id bigint,
  requested_release_id bigint,
  requested_available_at timestamptz,
  requested_due_at timestamptz
) returns bigint language plpgsql security definer set search_path='' as $$
declare release_row record; current_row record; created_id bigint;
begin
  if requested_due_at is not null and requested_available_at is not null and requested_due_at <= requested_available_at then
    raise exception using errcode='22023', message='Due date must be after availability';
  end if;
  if requested_due_at is not null and requested_available_at is null and requested_due_at <= pg_catalog.now() then
    raise exception using errcode='22023', message='Due date must be in the future';
  end if;
  select r.*,c.status as source_course_status into release_row from public.course_releases r join public.courses c on c.id=r.course_id where r.id=requested_release_id;
  if release_row.id is null or release_row.source_course_status='archived' then raise exception 'Course Release is unavailable'; end if;
  perform 1 from public.classes where id=requested_class_id and status='active'
    and (owner_user_id=auth.uid() or public.is_platform_admin()) for update;
  if not found then raise exception 'Active Class is unavailable'; end if;
  if release_row.owner_user_id<>auth.uid() and not public.is_platform_admin() then raise exception 'Course Release is unavailable'; end if;
  select * into current_row from public.class_course_assignments
    where class_id=requested_class_id and source_course_id=release_row.course_id and status='active' for update;
  if current_row.id is not null and current_row.course_release_id=requested_release_id then
    update public.class_course_assignments set available_at=requested_available_at,due_at=requested_due_at,updated_at=pg_catalog.now() where id=current_row.id;
    return current_row.id;
  end if;
  update public.class_course_assignments set status='inactive',ended_at=pg_catalog.now(),updated_at=pg_catalog.now()
    where id=current_row.id;
  insert into public.class_course_assignments(class_id,course_release_id,source_course_id,assigned_by,available_at,due_at)
    values(requested_class_id,requested_release_id,release_row.course_id,auth.uid(),requested_available_at,requested_due_at)
    returning id into created_id;
  if current_row.id is not null then
    perform public.project_assignment_release_progress(requested_class_id,current_row.course_release_id,requested_release_id);
  end if;
  return created_id;
end; $$;

create or replace function public.assign_class_course_release(requested_class_id bigint, requested_release_id bigint)
returns bigint language plpgsql security definer set search_path='' as $$
declare current_row record; release_course bigint;
begin
  select course_id into release_course from public.course_releases where id=requested_release_id;
  select * into current_row from public.class_course_assignments where class_id=requested_class_id and source_course_id=release_course and status='active';
  return public.assign_class_course_release(requested_class_id, requested_release_id,
    case when current_row.id is null then null else current_row.available_at end,
    case when current_row.id is null then null else current_row.due_at end);
end; $$;

create or replace function public.update_class_course_assignment_schedule(
  requested_assignment_id bigint,
  requested_available_at timestamptz,
  requested_due_at timestamptz
) returns void language plpgsql security definer set search_path='' as $$
declare assignment_row record;
begin
  if requested_due_at is not null and requested_available_at is not null and requested_due_at <= requested_available_at then
    raise exception using errcode='22023', message='Due date must be after availability';
  end if;
  if requested_due_at is not null and requested_available_at is null and requested_due_at <= pg_catalog.now() then
    raise exception using errcode='22023', message='Due date must be in the future';
  end if;
  select * into assignment_row from public.class_course_assignments where id=requested_assignment_id and status='active' for update;
  if assignment_row.id is null or not public.owns_class(assignment_row.class_id) then raise exception 'Assignment is unavailable'; end if;
  update public.class_course_assignments set available_at=requested_available_at,due_at=requested_due_at,updated_at=pg_catalog.now() where id=requested_assignment_id;
end; $$;

create or replace function public.get_class_course_assignments(requested_class_id bigint)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare staff_access boolean:=public.owns_class(requested_class_id); learner_access boolean;
begin
  select exists(select 1 from public.classes c join public.class_enrollments e on e.class_id=c.id
    where c.id=requested_class_id and c.status='active' and e.learner_user_id=auth.uid() and e.status='active') into learner_access;
  if not staff_access and not (public.is_learner_identity() and learner_access) then raise exception 'Class is unavailable'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
    'assignmentId',a.id,'classId',a.class_id,'releaseId',a.course_release_id,'courseId',a.source_course_id,
    'courseTitle',r.course_title,'courseDescription',r.course_description,'courseLevel',r.course_level,
    'releaseNumber',r.release_number,'assignedAt',a.assigned_at,'endedAt',a.ended_at,'status',a.status,
    'availableAt',a.available_at,'dueAt',a.due_at,'classTimezone',c.timezone,
    'latestReleaseNumber',(select max(n.release_number) from public.course_releases n where n.course_id=a.source_course_id)
  ) order by a.status,a.assigned_at desc)
  from public.class_course_assignments a join public.course_releases r on r.id=a.course_release_id join public.classes c on c.id=a.class_id
  where a.class_id=requested_class_id and (staff_access or a.status='active')),'[]'::jsonb);
end; $$;

create or replace function public.get_class_assignment_progress(requested_assignment_id bigint)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare assignment_row record; total_lessons integer;
begin
  select a.*,r.course_title,r.release_number,c.timezone into assignment_row
  from public.class_course_assignments a join public.course_releases r on r.id=a.course_release_id join public.classes c on c.id=a.class_id
  where a.id=requested_assignment_id;
  if assignment_row.id is null or not public.owns_class(assignment_row.class_id) then raise exception 'Assignment is unavailable'; end if;
  select count(*) into total_lessons from public.course_release_lessons l join public.course_release_units u on u.id=l.course_release_unit_id where u.course_release_id=assignment_row.course_release_id;
  return jsonb_build_object('assignmentId',assignment_row.id,'releaseId',assignment_row.course_release_id,
    'courseTitle',assignment_row.course_title,'releaseNumber',assignment_row.release_number,'totalLessons',total_lessons,
    'availableAt',assignment_row.available_at,'dueAt',assignment_row.due_at,'classTimezone',assignment_row.timezone,
    'learners',coalesce((select jsonb_agg(jsonb_build_object(
      'learnerId',e.learner_user_id,'email',u.email,
      'startedLessons',(select count(*) from public.learner_release_lesson_progress p join public.course_release_lessons l on l.id=p.course_release_lesson_id join public.course_release_units ru on ru.id=l.course_release_unit_id where p.learner_id=e.learner_user_id and ru.course_release_id=assignment_row.course_release_id),
      'completedLessons',(select count(*) from public.learner_release_lesson_progress p join public.course_release_lessons l on l.id=p.course_release_lesson_id join public.course_release_units ru on ru.id=l.course_release_unit_id where p.learner_id=e.learner_user_id and ru.course_release_id=assignment_row.course_release_id and p.completed_at is not null),
      'completionPercent',case when total_lessons=0 then 0 else round(100.0*(select count(*) from public.learner_release_lesson_progress p join public.course_release_lessons l on l.id=p.course_release_lesson_id join public.course_release_units ru on ru.id=l.course_release_unit_id where p.learner_id=e.learner_user_id and ru.course_release_id=assignment_row.course_release_id and p.completed_at is not null)/total_lessons) end,
      'lastAccessedAt',(select max(p.last_accessed_at) from public.learner_release_lesson_progress p join public.course_release_lessons l on l.id=p.course_release_lesson_id join public.course_release_units ru on ru.id=l.course_release_unit_id where p.learner_id=e.learner_user_id and ru.course_release_id=assignment_row.course_release_id)
    ) order by u.email) from public.class_enrollments e join auth.users u on u.id=e.learner_user_id where e.class_id=assignment_row.class_id and e.status='active'),'[]'::jsonb));
end; $$;

revoke all on function public.assign_class_course_release(bigint,bigint,timestamptz,timestamptz), public.update_class_course_assignment_schedule(bigint,timestamptz,timestamptz), public.update_owned_class(bigint,text,text,public.class_status,text) from public,anon;
grant execute on function public.assign_class_course_release(bigint,bigint,timestamptz,timestamptz), public.update_class_course_assignment_schedule(bigint,timestamptz,timestamptz), public.update_owned_class(bigint,text,text,public.class_status,text) to authenticated;

commit;
