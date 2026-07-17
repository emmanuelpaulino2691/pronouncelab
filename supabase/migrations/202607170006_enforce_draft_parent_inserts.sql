begin;

drop policy if exists "units_insert_draft"
  on public.units;
create policy "units_insert_draft"
on public.units for insert
to authenticated
with check (
  public.can_edit_drafts()
  and status = 'draft'
  and exists (
    select 1
    from public.courses as course
    where course.id = units.course_id
      and course.status = 'draft'
  )
);

drop policy if exists "lessons_insert_draft"
  on public.lessons;
create policy "lessons_insert_draft"
on public.lessons for insert
to authenticated
with check (
  public.can_edit_drafts()
  and status = 'draft'
  and current_published_version_id is null
  and exists (
    select 1
    from public.units as unit
    join public.courses as course
      on course.id = unit.course_id
    where unit.id = lessons.unit_id
      and unit.status = 'draft'
      and course.status = 'draft'
  )
);

commit;
