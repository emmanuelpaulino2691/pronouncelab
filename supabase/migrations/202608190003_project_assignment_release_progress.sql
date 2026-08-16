begin;

create or replace function public.project_assignment_release_progress(
  requested_class_id bigint,
  previous_release_id bigint,
  next_release_id bigint
) returns void language sql security definer set search_path='' as $$
  insert into public.learner_release_lesson_progress(
    learner_id,course_release_lesson_id,started_at,completed_at,last_accessed_at
  )
  select enrollment.learner_user_id,next_lesson.id,previous_progress.started_at,
    previous_progress.completed_at,previous_progress.last_accessed_at
  from public.class_enrollments enrollment
  join public.learner_release_lesson_progress previous_progress
    on previous_progress.learner_id=enrollment.learner_user_id and previous_progress.completed_at is not null
  join public.course_release_lessons previous_lesson on previous_lesson.id=previous_progress.course_release_lesson_id
  join public.course_release_units previous_unit on previous_unit.id=previous_lesson.course_release_unit_id and previous_unit.course_release_id=previous_release_id
  join public.course_release_lessons next_lesson on next_lesson.source_lesson_id=previous_lesson.source_lesson_id
  join public.course_release_units next_unit on next_unit.id=next_lesson.course_release_unit_id and next_unit.course_release_id=next_release_id
  where enrollment.class_id=requested_class_id and enrollment.status='active'
  on conflict(learner_id,course_release_lesson_id) do update set
    started_at=least(public.learner_release_lesson_progress.started_at,excluded.started_at),
    completed_at=coalesce(public.learner_release_lesson_progress.completed_at,excluded.completed_at),
    last_accessed_at=greatest(public.learner_release_lesson_progress.last_accessed_at,excluded.last_accessed_at);
$$;

create or replace function public.assign_class_course_release(requested_class_id bigint,requested_release_id bigint)
returns bigint language plpgsql security definer set search_path='' as $$
declare release_row record; current_id bigint; previous_release_id bigint; created_id bigint;
begin
  select release.*,course.status as source_course_status into release_row
  from public.course_releases release join public.courses course on course.id=release.course_id
  where release.id=requested_release_id;
  if release_row.id is null or release_row.source_course_status='archived' then raise exception 'Course Release is unavailable'; end if;
  perform 1 from public.classes where id=requested_class_id and status='active' and (owner_user_id=auth.uid() or public.is_platform_admin()) for update;
  if not found then raise exception 'Active Class is unavailable'; end if;
  if release_row.owner_user_id<>auth.uid() and not public.is_platform_admin() then raise exception 'Course Release is unavailable'; end if;
  select id,course_release_id into current_id,previous_release_id from public.class_course_assignments
    where class_id=requested_class_id and source_course_id=release_row.course_id and status='active' for update;
  if current_id is not null and previous_release_id=requested_release_id then return current_id; end if;
  update public.class_course_assignments set status='inactive',ended_at=pg_catalog.now(),updated_at=pg_catalog.now() where id=current_id;
  insert into public.class_course_assignments(class_id,course_release_id,source_course_id,assigned_by)
    values(requested_class_id,requested_release_id,release_row.course_id,auth.uid()) returning id into created_id;
  if previous_release_id is not null then
    perform public.project_assignment_release_progress(requested_class_id,previous_release_id,requested_release_id);
  end if;
  return created_id;
end; $$;

revoke all on function public.project_assignment_release_progress(bigint,bigint,bigint) from public,anon,authenticated;
revoke all on function public.assign_class_course_release(bigint,bigint) from public,anon;
grant execute on function public.assign_class_course_release(bigint,bigint) to authenticated;
comment on function public.project_assignment_release_progress(bigint,bigint,bigint) is 'Projects active enrolled learners completed Lessons between assignment Releases by stable source Lesson identity without rewriting historical progress.';

commit;
