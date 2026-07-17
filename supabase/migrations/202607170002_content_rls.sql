begin;

create or replace function public.has_admin_role(
  requested_role public.admin_role
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = requested_role
  );
$$;

create or replace function public.can_manage_content()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.has_admin_role('editor')
    or public.has_admin_role('publisher')
    or public.has_admin_role('admin');
$$;

create or replace function public.can_edit_drafts()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.has_admin_role('editor')
    or public.has_admin_role('admin');
$$;

create or replace function public.can_publish_content()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.has_admin_role('publisher')
    or public.has_admin_role('admin');
$$;

create or replace function public.is_published_lesson_version(
  requested_version_id bigint
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.lesson_versions as version
    join public.lessons as lesson
      on lesson.id = version.lesson_id
    join public.units as unit
      on unit.id = lesson.unit_id
    join public.courses as course
      on course.id = unit.course_id
    where version.id = requested_version_id
      and version.status = 'published'
      and lesson.status = 'published'
      and lesson.current_published_version_id = version.id
      and unit.status = 'published'
      and course.status = 'published'
  );
$$;

create or replace function public.is_published_activity(
  requested_activity_id bigint
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.lesson_activities as activity
    where activity.id = requested_activity_id
      and public.is_published_lesson_version(
        activity.lesson_version_id
      )
  );
$$;

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
    where activity.id = requested_activity_id
      and version.status = 'draft'
  );
$$;

create or replace function public.is_published_assessment(
  requested_assessment_id bigint
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.assessment_sets as assessment
    where assessment.id = requested_assessment_id
      and public.is_published_activity(
        assessment.activity_id
      )
  );
$$;

create or replace function public.is_draft_assessment(
  requested_assessment_id bigint
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.assessment_sets as assessment
    where assessment.id = requested_assessment_id
      and public.is_draft_activity(
        assessment.activity_id
      )
  );
$$;

create or replace function public.is_published_question(
  requested_question_id bigint
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.questions as question
    where question.id = requested_question_id
      and public.is_published_assessment(
        question.assessment_set_id
      )
  );
$$;

create or replace function public.is_draft_question(
  requested_question_id bigint
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.questions as question
    where question.id = requested_question_id
      and public.is_draft_assessment(
        question.assessment_set_id
      )
  );
$$;

revoke all on function public.has_admin_role(public.admin_role)
  from public;
revoke all on function public.can_manage_content()
  from public;
revoke all on function public.can_edit_drafts()
  from public;
revoke all on function public.can_publish_content()
  from public;
revoke all on function public.is_published_lesson_version(bigint)
  from public;
revoke all on function public.is_published_activity(bigint)
  from public;
revoke all on function public.is_draft_activity(bigint)
  from public;
revoke all on function public.is_published_assessment(bigint)
  from public;
revoke all on function public.is_draft_assessment(bigint)
  from public;
revoke all on function public.is_published_question(bigint)
  from public;
revoke all on function public.is_draft_question(bigint)
  from public;

grant execute on function public.has_admin_role(public.admin_role)
  to authenticated;
grant execute on function public.can_manage_content()
  to anon, authenticated;
grant execute on function public.can_edit_drafts()
  to authenticated;
grant execute on function public.can_publish_content()
  to authenticated;

grant execute on function public.is_published_lesson_version(bigint)
  to anon, authenticated;
grant execute on function public.is_published_activity(bigint)
  to anon, authenticated;
grant execute on function public.is_published_assessment(bigint)
  to anon, authenticated;
grant execute on function public.is_published_question(bigint)
  to anon, authenticated;
grant execute on function public.is_draft_activity(bigint)
  to authenticated;
grant execute on function public.is_draft_assessment(bigint)
  to authenticated;
grant execute on function public.is_draft_question(bigint)
  to authenticated;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.courses enable row level security;
alter table public.units enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_versions enable row level security;
alter table public.lesson_activities enable row level security;
alter table public.theory_blocks enable row level security;
alter table public.listening_items enable row level security;
alter table public.pronunciation_items enable row level security;
alter table public.assessment_sets enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.media_assets enable row level security;

grant select on public.courses, public.units, public.lessons,
  public.lesson_versions, public.lesson_activities,
  public.theory_blocks, public.listening_items,
  public.pronunciation_items, public.assessment_sets,
  public.questions, public.question_options,
  public.media_assets
to anon, authenticated;

grant select, insert, update, delete
on public.profiles, public.user_roles
to authenticated;

grant insert, update, delete
on public.courses, public.units, public.lessons,
  public.lesson_versions, public.lesson_activities,
  public.theory_blocks, public.listening_items,
  public.pronunciation_items, public.assessment_sets,
  public.questions, public.question_options,
  public.media_assets
to authenticated;

grant usage, select on all sequences in schema public
to authenticated;

create policy "profiles_select_own_or_admin"
on public.profiles for select
to authenticated
using (
  id = auth.uid()
  or public.has_admin_role('admin')
);

create policy "profiles_insert_own_or_admin"
on public.profiles for insert
to authenticated
with check (
  id = auth.uid()
  or public.has_admin_role('admin')
);

create policy "profiles_update_own_or_admin"
on public.profiles for update
to authenticated
using (
  id = auth.uid()
  or public.has_admin_role('admin')
)
with check (
  id = auth.uid()
  or public.has_admin_role('admin')
);

create policy "profiles_delete_admin"
on public.profiles for delete
to authenticated
using (public.has_admin_role('admin'));

create policy "user_roles_select_own_or_admin"
on public.user_roles for select
to authenticated
using (
  user_id = auth.uid()
  or public.has_admin_role('admin')
);

create policy "user_roles_insert_admin"
on public.user_roles for insert
to authenticated
with check (public.has_admin_role('admin'));

create policy "user_roles_update_admin"
on public.user_roles for update
to authenticated
using (public.has_admin_role('admin'))
with check (public.has_admin_role('admin'));

create policy "user_roles_delete_admin"
on public.user_roles for delete
to authenticated
using (public.has_admin_role('admin'));

create policy "courses_select_published_or_manager"
on public.courses for select
to anon, authenticated
using (
  status = 'published'
  or public.can_manage_content()
);

create policy "courses_insert_draft"
on public.courses for insert
to authenticated
with check (
  public.can_edit_drafts()
  and status = 'draft'
);

create policy "courses_update_draft"
on public.courses for update
to authenticated
using (
  public.can_edit_drafts()
  and status = 'draft'
)
with check (
  public.can_edit_drafts()
  and status = 'draft'
);

create policy "courses_publish"
on public.courses for update
to authenticated
using (public.can_publish_content())
with check (public.can_publish_content());

create policy "courses_delete_admin"
on public.courses for delete
to authenticated
using (public.has_admin_role('admin'));

create policy "courses_delete_draft_editor"
on public.courses for delete
to authenticated
using (
  public.can_edit_drafts()
  and status = 'draft'
);

create policy "units_select_published_or_manager"
on public.units for select
to anon, authenticated
using (
  (
    status = 'published'
    and exists (
      select 1
      from public.courses
      where courses.id = units.course_id
        and courses.status = 'published'
    )
  )
  or public.can_manage_content()
);

create policy "units_insert_draft"
on public.units for insert
to authenticated
with check (
  public.can_edit_drafts()
  and status = 'draft'
);

create policy "units_update_draft"
on public.units for update
to authenticated
using (
  public.can_edit_drafts()
  and status = 'draft'
)
with check (
  public.can_edit_drafts()
  and status = 'draft'
);

create policy "units_publish"
on public.units for update
to authenticated
using (public.can_publish_content())
with check (public.can_publish_content());

create policy "units_delete_admin"
on public.units for delete
to authenticated
using (public.has_admin_role('admin'));

create policy "units_delete_draft_editor"
on public.units for delete
to authenticated
using (
  public.can_edit_drafts()
  and status = 'draft'
);

create policy "lessons_select_published_or_manager"
on public.lessons for select
to anon, authenticated
using (
  (
    status = 'published'
    and current_published_version_id is not null
    and exists (
      select 1
      from public.units
      join public.courses
        on courses.id = units.course_id
      where units.id = lessons.unit_id
        and units.status = 'published'
        and courses.status = 'published'
    )
  )
  or public.can_manage_content()
);

create policy "lessons_insert_draft"
on public.lessons for insert
to authenticated
with check (
  public.can_edit_drafts()
  and status = 'draft'
  and current_published_version_id is null
);

create policy "lessons_update_draft"
on public.lessons for update
to authenticated
using (
  public.can_edit_drafts()
  and status = 'draft'
)
with check (
  public.can_edit_drafts()
  and status = 'draft'
  and current_published_version_id is null
);

create policy "lessons_publish"
on public.lessons for update
to authenticated
using (public.can_publish_content())
with check (public.can_publish_content());

create policy "lessons_delete_admin"
on public.lessons for delete
to authenticated
using (public.has_admin_role('admin'));

create policy "lessons_delete_draft_editor"
on public.lessons for delete
to authenticated
using (
  public.can_edit_drafts()
  and status = 'draft'
);

create policy "lesson_versions_select_published_or_manager"
on public.lesson_versions for select
to anon, authenticated
using (
  public.is_published_lesson_version(id)
  or public.can_manage_content()
);

create policy "lesson_versions_insert_draft"
on public.lesson_versions for insert
to authenticated
with check (
  public.can_edit_drafts()
  and status = 'draft'
);

create policy "lesson_versions_update_draft"
on public.lesson_versions for update
to authenticated
using (
  public.can_edit_drafts()
  and status = 'draft'
)
with check (
  public.can_edit_drafts()
  and status = 'draft'
);

create policy "lesson_versions_publish"
on public.lesson_versions for update
to authenticated
using (public.can_publish_content())
with check (public.can_publish_content());

create policy "lesson_versions_delete_draft"
on public.lesson_versions for delete
to authenticated
using (
  public.has_admin_role('admin')
  and status <> 'published'
);

create policy "lesson_versions_delete_draft_editor"
on public.lesson_versions for delete
to authenticated
using (
  public.can_edit_drafts()
  and status = 'draft'
);

create policy "lesson_activities_select_published_or_manager"
on public.lesson_activities for select
to anon, authenticated
using (
  public.is_published_lesson_version(
    lesson_version_id
  )
  or public.can_manage_content()
);

create policy "lesson_activities_insert_draft"
on public.lesson_activities for insert
to authenticated
with check (
  public.can_edit_drafts()
  and exists (
    select 1
    from public.lesson_versions
    where lesson_versions.id = lesson_version_id
      and lesson_versions.status = 'draft'
  )
);

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
    from public.lesson_versions
    where lesson_versions.id =
      lesson_version_id
      and lesson_versions.status = 'draft'
  )
);

create policy "lesson_activities_delete_draft"
on public.lesson_activities for delete
to authenticated
using (
  public.can_edit_drafts()
  and public.is_draft_activity(id)
);

create policy "theory_blocks_select_published_or_manager"
on public.theory_blocks for select
to anon, authenticated
using (
  public.is_published_activity(activity_id)
  or public.can_manage_content()
);

create policy "theory_blocks_insert_draft"
on public.theory_blocks for insert
to authenticated
with check (
  public.can_edit_drafts()
  and public.is_draft_activity(activity_id)
);

create policy "theory_blocks_update_draft"
on public.theory_blocks for update
to authenticated
using (
  public.can_edit_drafts()
  and public.is_draft_activity(activity_id)
)
with check (
  public.can_edit_drafts()
  and public.is_draft_activity(activity_id)
);

create policy "theory_blocks_delete_draft"
on public.theory_blocks for delete
to authenticated
using (
  public.can_edit_drafts()
  and public.is_draft_activity(activity_id)
);

create policy "listening_items_select_published_or_manager"
on public.listening_items for select
to anon, authenticated
using (
  public.is_published_activity(activity_id)
  or public.can_manage_content()
);

create policy "listening_items_insert_draft"
on public.listening_items for insert
to authenticated
with check (
  public.can_edit_drafts()
  and public.is_draft_activity(activity_id)
);

create policy "listening_items_update_draft"
on public.listening_items for update
to authenticated
using (
  public.can_edit_drafts()
  and public.is_draft_activity(activity_id)
)
with check (
  public.can_edit_drafts()
  and public.is_draft_activity(activity_id)
);

create policy "listening_items_delete_draft"
on public.listening_items for delete
to authenticated
using (
  public.can_edit_drafts()
  and public.is_draft_activity(activity_id)
);

create policy "pronunciation_items_select_published_or_manager"
on public.pronunciation_items for select
to anon, authenticated
using (
  public.is_published_activity(activity_id)
  or public.can_manage_content()
);

create policy "pronunciation_items_insert_draft"
on public.pronunciation_items for insert
to authenticated
with check (
  public.can_edit_drafts()
  and public.is_draft_activity(activity_id)
);

create policy "pronunciation_items_update_draft"
on public.pronunciation_items for update
to authenticated
using (
  public.can_edit_drafts()
  and public.is_draft_activity(activity_id)
)
with check (
  public.can_edit_drafts()
  and public.is_draft_activity(activity_id)
);

create policy "pronunciation_items_delete_draft"
on public.pronunciation_items for delete
to authenticated
using (
  public.can_edit_drafts()
  and public.is_draft_activity(activity_id)
);

create policy "assessment_sets_select_published_or_manager"
on public.assessment_sets for select
to anon, authenticated
using (
  public.is_published_activity(activity_id)
  or public.can_manage_content()
);

create policy "assessment_sets_insert_draft"
on public.assessment_sets for insert
to authenticated
with check (
  public.can_edit_drafts()
  and public.is_draft_activity(activity_id)
);

create policy "assessment_sets_update_draft"
on public.assessment_sets for update
to authenticated
using (
  public.can_edit_drafts()
  and public.is_draft_activity(activity_id)
)
with check (
  public.can_edit_drafts()
  and public.is_draft_activity(activity_id)
);

create policy "assessment_sets_delete_draft"
on public.assessment_sets for delete
to authenticated
using (
  public.can_edit_drafts()
  and public.is_draft_activity(activity_id)
);

create policy "questions_select_published_or_manager"
on public.questions for select
to anon, authenticated
using (
  public.is_published_assessment(
    assessment_set_id
  )
  or public.can_manage_content()
);

create policy "questions_insert_draft"
on public.questions for insert
to authenticated
with check (
  public.can_edit_drafts()
  and public.is_draft_assessment(
    assessment_set_id
  )
);

create policy "questions_update_draft"
on public.questions for update
to authenticated
using (
  public.can_edit_drafts()
  and public.is_draft_assessment(
    assessment_set_id
  )
)
with check (
  public.can_edit_drafts()
  and public.is_draft_assessment(
    assessment_set_id
  )
);

create policy "questions_delete_draft"
on public.questions for delete
to authenticated
using (
  public.can_edit_drafts()
  and public.is_draft_assessment(
    assessment_set_id
  )
);

create policy "question_options_select_published_or_manager"
on public.question_options for select
to anon, authenticated
using (
  public.is_published_question(question_id)
  or public.can_manage_content()
);

create policy "question_options_insert_draft"
on public.question_options for insert
to authenticated
with check (
  public.can_edit_drafts()
  and public.is_draft_question(question_id)
);

create policy "question_options_update_draft"
on public.question_options for update
to authenticated
using (
  public.can_edit_drafts()
  and public.is_draft_question(question_id)
)
with check (
  public.can_edit_drafts()
  and public.is_draft_question(question_id)
);

create policy "question_options_delete_draft"
on public.question_options for delete
to authenticated
using (
  public.can_edit_drafts()
  and public.is_draft_question(question_id)
);

create policy "media_assets_select_published_or_manager"
on public.media_assets for select
to anon, authenticated
using (
  status = 'published'
  or public.can_manage_content()
);

create policy "media_assets_insert_draft"
on public.media_assets for insert
to authenticated
with check (
  public.can_edit_drafts()
  and status = 'draft'
  and uploaded_by = auth.uid()
);

create policy "media_assets_update_draft"
on public.media_assets for update
to authenticated
using (
  public.can_edit_drafts()
  and status = 'draft'
)
with check (
  public.can_edit_drafts()
  and status = 'draft'
);

create policy "media_assets_publish"
on public.media_assets for update
to authenticated
using (public.can_publish_content())
with check (public.can_publish_content());

create policy "media_assets_delete_admin"
on public.media_assets for delete
to authenticated
using (public.has_admin_role('admin'));

create policy "media_assets_delete_draft_editor"
on public.media_assets for delete
to authenticated
using (
  public.can_edit_drafts()
  and status = 'draft'
);

commit;
