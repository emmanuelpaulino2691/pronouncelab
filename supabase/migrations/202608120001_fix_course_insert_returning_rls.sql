begin;

drop policy if exists courses_select_published_or_owned
  on public.courses;

create policy courses_select_published_or_owned
on public.courses for select
to anon, authenticated
using (
  status = 'published'
  or public.can_view_all_courses()
  or (
    public.is_content_teacher()
    and owner_user_id = auth.uid()
  )
);

commit;
