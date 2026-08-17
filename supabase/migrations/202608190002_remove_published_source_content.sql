begin;

create or replace function public.remove_authoring_lesson(
  requested_lesson_id bigint,
  expected_unit_id bigint
)
returns bigint language plpgsql security definer set search_path = '' as $$
declare target_course_id bigint; lesson_row public.lessons%rowtype;
begin
  perform public.lock_content_hierarchy_gate();
  select lesson.* into lesson_row
  from public.lessons lesson join public.units unit on unit.id=lesson.unit_id
  where lesson.id=requested_lesson_id and lesson.unit_id=expected_unit_id
  for update of unit, lesson;
  if not found then raise exception 'Lesson is unavailable in the expected Unit'; end if;
  select course_id into target_course_id from public.units where id=expected_unit_id;
  if not public.can_edit_course(target_course_id) then raise exception 'Course owner or administrator permission is required'; end if;
  if lesson_row.status='archived' then return lesson_row.id; end if;
  if lesson_row.status='draft' and lesson_row.current_published_version_id is null
    and not exists(select 1 from public.course_release_lessons where source_lesson_id=lesson_row.id)
  then
    perform public.delete_draft_lesson_descendants(lesson_row.id);
    delete from public.lessons where id=lesson_row.id and unit_id=expected_unit_id;
  else
    update public.lessons set status='archived',updated_by=auth.uid() where id=lesson_row.id;
  end if;
  return lesson_row.id;
end; $$;

create or replace function public.remove_authoring_unit(
  requested_unit_id bigint,
  expected_course_id bigint
)
returns bigint language plpgsql security definer set search_path = '' as $$
declare unit_row public.units%rowtype; lesson_row record;
begin
  perform public.lock_content_hierarchy_gate();
  select * into unit_row from public.units
  where id=requested_unit_id and course_id=expected_course_id for update;
  if not found then raise exception 'Unit is unavailable in the expected Course'; end if;
  if not public.can_edit_course(expected_course_id) then raise exception 'Course owner or administrator permission is required'; end if;
  if unit_row.status='archived' then return unit_row.id; end if;
  if unit_row.status='draft'
    and not exists(select 1 from public.course_release_units where source_unit_id=unit_row.id)
    and not exists(select 1 from public.lessons where unit_id=unit_row.id and (status<>'draft' or current_published_version_id is not null))
  then
    for lesson_row in select id from public.lessons where unit_id=unit_row.id order by id for update
    loop
      perform public.delete_draft_lesson_descendants(lesson_row.id);
    end loop;
    delete from public.lessons where unit_id=unit_row.id;
    delete from public.units where id=unit_row.id and course_id=expected_course_id;
  else
    for lesson_row in select id from public.lessons where unit_id=unit_row.id and status<>'archived' order by id for update
    loop
      perform public.remove_authoring_lesson(lesson_row.id,unit_row.id);
    end loop;
    update public.units set status='archived',updated_by=auth.uid() where id=unit_row.id;
  end if;
  return unit_row.id;
end; $$;

create or replace function public.remove_authoring_course(requested_course_id bigint)
returns bigint language plpgsql security definer set search_path = '' as $$
declare course_row public.courses%rowtype;
begin
  perform public.lock_content_hierarchy_gate();
  select * into course_row from public.courses where id=requested_course_id for update;
  if not found then raise exception 'Course is unavailable'; end if;
  if not public.can_edit_course(requested_course_id) then raise exception 'Course owner or administrator permission is required'; end if;
  if course_row.status='archived' then return course_row.id; end if;
  if course_row.status='draft'
    and not exists(select 1 from public.course_releases where course_id=course_row.id)
    and not exists(
      select 1 from public.units unit left join public.lessons lesson on lesson.unit_id=unit.id
      where unit.course_id=course_row.id and (unit.status<>'draft' or lesson.status<>'draft' or lesson.current_published_version_id is not null)
    )
  then
    return public.delete_draft_course(course_row.id);
  end if;
  update public.courses set status='archived',learner_visibility='class_only',
    learner_visibility_updated_at=pg_catalog.now(),updated_by=auth.uid()
  where id=course_row.id;
  delete from public.course_unlisted_share_links where course_id=course_row.id;
  delete from public.learner_independent_course_access where course_id=course_row.id;
  return course_row.id;
end; $$;

create or replace function public.set_course_learner_visibility(
  requested_course_id bigint,
  requested_visibility public.course_learner_visibility
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare previous_visibility public.course_learner_visibility; course_status public.content_status; generated_token text;
begin
  if not (public.is_course_owner(requested_course_id) or public.is_platform_admin()) then
    raise exception 'Course visibility is unavailable';
  end if;
  select learner_visibility,status into previous_visibility,course_status
  from public.courses where id=requested_course_id for update;
  if previous_visibility is null then raise exception 'Course is unavailable'; end if;
  if course_status='archived' then raise exception 'Course visibility is unavailable for a retired Course'; end if;
  update public.courses set learner_visibility=requested_visibility,
    learner_visibility_updated_at=pg_catalog.now() where id=requested_course_id;
  if requested_visibility<>'unlisted' then
    delete from public.course_unlisted_share_links where course_id=requested_course_id;
    delete from public.learner_independent_course_access where course_id=requested_course_id;
  elsif previous_visibility<>'unlisted' then
    generated_token:=encode(extensions.gen_random_bytes(32),'hex');
    insert into public.course_unlisted_share_links(course_id,token_hash,created_by)
    values(requested_course_id,encode(extensions.digest(pg_catalog.convert_to(generated_token,'UTF8'),'sha256'),'hex'),auth.uid())
    on conflict(course_id) do update set token_hash=excluded.token_hash,created_at=pg_catalog.now(),created_by=excluded.created_by;
  end if;
  return pg_catalog.jsonb_build_object('courseId',requested_course_id,'visibility',requested_visibility,'shareToken',generated_token);
end; $$;

create or replace function public.list_assignable_course_releases()
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
  if not (public.is_content_teacher() or public.is_platform_admin()) then raise exception 'Teacher access is required'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
    'releaseId',release.id,'courseId',release.course_id,'courseTitle',release.course_title,'courseDescription',release.course_description,
    'courseLevel',release.course_level,'releaseNumber',release.release_number,'releasedAt',release.released_at,
    'isLatest',release.release_number=(select max(next_release.release_number) from public.course_releases next_release where next_release.course_id=release.course_id)
  ) order by release.course_title,release.release_number desc)
  from public.course_releases release join public.courses course on course.id=release.course_id
  where course.status<>'archived' and (release.owner_user_id=auth.uid() or public.is_platform_admin())),'[]'::jsonb);
end; $$;

create or replace function public.assign_class_course_release(requested_class_id bigint,requested_release_id bigint)
returns bigint language plpgsql security definer set search_path='' as $$
declare release_row record; current_id bigint; created_id bigint;
begin
  select release.*,course.status as source_course_status into release_row
  from public.course_releases release join public.courses course on course.id=release.course_id
  where release.id=requested_release_id;
  if release_row.id is null or release_row.source_course_status='archived' then raise exception 'Course Release is unavailable'; end if;
  perform 1 from public.classes where id=requested_class_id and status='active' and (owner_user_id=auth.uid() or public.is_platform_admin()) for update;
  if not found then raise exception 'Active Class is unavailable'; end if;
  if release_row.owner_user_id<>auth.uid() and not public.is_platform_admin() then raise exception 'Course Release is unavailable'; end if;
  select id into current_id from public.class_course_assignments
    where class_id=requested_class_id and source_course_id=release_row.course_id and status='active' for update;
  if current_id is not null and exists(select 1 from public.class_course_assignments where id=current_id and course_release_id=requested_release_id) then return current_id; end if;
  update public.class_course_assignments set status='inactive',ended_at=pg_catalog.now(),updated_at=pg_catalog.now() where id=current_id;
  insert into public.class_course_assignments(class_id,course_release_id,source_course_id,assigned_by)
    values(requested_class_id,requested_release_id,release_row.course_id,auth.uid()) returning id into created_id;
  return created_id;
end; $$;

revoke all on function public.remove_authoring_course(bigint),public.remove_authoring_unit(bigint,bigint),public.remove_authoring_lesson(bigint,bigint) from public,anon;
grant execute on function public.remove_authoring_course(bigint),public.remove_authoring_unit(bigint,bigint),public.remove_authoring_lesson(bigint,bigint) to authenticated;
revoke all on function public.list_assignable_course_releases(),public.assign_class_course_release(bigint,bigint) from public,anon;
grant execute on function public.list_assignable_course_releases(),public.assign_class_course_release(bigint,bigint) to authenticated;
revoke all on function public.set_course_learner_visibility(bigint,public.course_learner_visibility) from public,anon;
grant execute on function public.set_course_learner_visibility(bigint,public.course_learner_visibility) to authenticated;

comment on function public.remove_authoring_course(bigint) is 'Hard-deletes unpublished draft-only content; otherwise retires the source Course while preserving Releases, assignments, and progress.';
comment on function public.remove_authoring_unit(bigint,bigint) is 'Hard-deletes draft-only Units; otherwise archives the Unit and removes it from future Releases.';
comment on function public.remove_authoring_lesson(bigint,bigint) is 'Hard-deletes draft-only Lessons; otherwise archives the Lesson and removes it from future Releases.';

commit;
