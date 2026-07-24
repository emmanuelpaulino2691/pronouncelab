begin;

create extension if not exists pgtap
  with schema extensions;

set local search_path =
  public, extensions, pg_catalog;

select plan(21);

insert into auth.users (id)
values
  ('91500000-0000-4000-8000-000000000001'),
  ('91500000-0000-4000-8000-000000000002'),
  ('91500000-0000-4000-8000-000000000003'),
  ('91500000-0000-4000-8000-000000000004'),
  ('91500000-0000-4000-8000-000000000005');

insert into public.user_roles (user_id, role)
values
  (
    '91500000-0000-4000-8000-000000000001',
    'teacher'
  ),
  (
    '91500000-0000-4000-8000-000000000002',
    'teacher'
  ),
  (
    '91500000-0000-4000-8000-000000000003',
    'admin'
  ),
  (
    '91500000-0000-4000-8000-000000000004',
    'publisher'
  );

set local request.jwt.claim.sub =
  '91500000-0000-4000-8000-000000000001';
insert into public.courses (
  id,
  slug,
  title,
  description,
  level,
  emoji,
  position,
  status
)
values (
  915001,
  'teacher-one-private',
  'Teacher one private',
  '',
  'A1',
  '',
  915001,
  'draft'
);
insert into public.units (
  id,
  course_id,
  title,
  position,
  status
)
values (915011, 915001, 'Unit one', 0, 'draft');
insert into public.lessons (
  id,
  unit_id,
  title,
  position,
  status
)
values (915012, 915011, 'Lesson one', 0, 'draft');
insert into public.lesson_versions (
  id,
  lesson_id,
  version_number,
  status
)
values (915013, 915012, 1, 'draft');

set local request.jwt.claim.sub =
  '91500000-0000-4000-8000-000000000002';
insert into public.courses (
  id,
  slug,
  title,
  description,
  level,
  emoji,
  position,
  status
)
values (
  915002,
  'teacher-two-private',
  'Teacher two private',
  '',
  'A1',
  '',
  915002,
  'draft'
);
insert into public.units (
  id,
  course_id,
  title,
  position,
  status
)
values (915021, 915002, 'Unit two', 0, 'draft');
insert into public.lessons (
  id,
  unit_id,
  title,
  position,
  status
)
values (915022, 915021, 'Lesson two', 0, 'draft');
insert into public.lesson_versions (
  id,
  lesson_id,
  version_number,
  status
)
values (915023, 915022, 1, 'draft');

select is(
  (
    select owner_user_id
    from public.courses
    where id = 915001
  ),
  '91500000-0000-4000-8000-000000000001'::uuid,
  'new courses are owned by their authenticated creator'
);

select is(
  (
    select count(*)::integer
    from public.courses
    where owner_user_id is null
  ),
  0,
  'every course has an owner'
);

set local role authenticated;
set local request.jwt.claim.sub =
  '91500000-0000-4000-8000-000000000001';

select is(
  public.can_manage_content(),
  true,
  'teacher role can enter the Studio'
);
select is(
  public.can_edit_drafts(),
  true,
  'teacher role can author drafts'
);
select is(
  public.can_publish_content(),
  true,
  'teacher role has owner-scoped publication capability'
);
select is(
  public.can_edit_course(915001),
  true,
  'teacher can edit an owned course'
);
select is(
  public.can_edit_course(915002),
  false,
  'teacher cannot edit another teacher course'
);
select results_eq(
  $test$
    select id
    from public.courses
    where id in (915001, 915002)
    order by id
  $test$,
  $test$
    values (915001::bigint)
  $test$,
  'teacher RLS shows only the owned private course'
);
select is(
  (
    with changed as (
      update public.courses
      set title = 'Forbidden change'
      where id = 915002
      returning id
    )
    select count(*)::integer from changed
  ),
  0,
  'teacher cannot update another teacher course'
);
select lives_ok(
  $test$
    select public.duplicate_draft_course(915001)
  $test$,
  'teacher can duplicate an owned draft course'
);
select throws_ok(
  $test$
    select public.duplicate_draft_course(915002)
  $test$,
  'Only the course owner or an administrator can duplicate this course',
  'teacher cannot duplicate another teacher course'
);
select is(
  public.can_publish_course(915001),
  true,
  'teacher can publish an owned course'
);
select is(
  public.can_publish_course(915002),
  false,
  'teacher cannot publish another teacher course'
);
select lives_ok(
  $test$
    select public.publish_lesson_version(915013)
  $test$,
  'teacher can publish a version in an owned course'
);
select throws_ok(
  $test$
    select public.publish_lesson_version(915023)
  $test$,
  'Course publication permission is required',
  'teacher cannot publish a version in another teacher course'
);

set local request.jwt.claim.sub =
  '91500000-0000-4000-8000-000000000004';
select is(
  (
    select count(*)::integer
    from public.courses
    where id in (915001, 915002)
  ),
  2,
  'publisher retains visibility across teacher courses'
);
select lives_ok(
  $test$
    select public.publish_lesson_version(915023)
  $test$,
  'publisher retains global publication authority'
);

set local request.jwt.claim.sub =
  '91500000-0000-4000-8000-000000000003';
select is(
  (
    select count(*)::integer
    from public.courses
    where id in (915001, 915002)
  ),
  2,
  'administrator can see every teacher course'
);
select is(
  public.can_publish_course(915001),
  true,
  'administrator has publication authority across owners'
);
select lives_ok(
  $test$
    update public.courses
    set title = 'Administrator-reviewed course'
    where id = 915002
  $test$,
  'administrator can edit another owner course'
);

set local request.jwt.claim.sub =
  '91500000-0000-4000-8000-000000000005';
select is(
  (
    select count(*)::integer
    from public.courses
    where id in (915001, 915002)
  ),
  0,
  'authenticated learner cannot see private teacher courses'
);

reset role;
select * from extensions.finish();

rollback;
