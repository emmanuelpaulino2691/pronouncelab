begin;

create extension if not exists pgtap
  with schema extensions;

set local search_path =
  public, extensions, pg_catalog;

select plan(7);

insert into auth.users (id)
values
  ('92000000-0000-4000-8000-000000000001'),
  ('92000000-0000-4000-8000-000000000002'),
  ('92000000-0000-4000-8000-000000000003');

insert into public.user_roles (user_id, role)
values
  ('92000000-0000-4000-8000-000000000001', 'teacher'),
  ('92000000-0000-4000-8000-000000000002', 'teacher'),
  ('92000000-0000-4000-8000-000000000003', 'admin');

set local role authenticated;
set local request.jwt.claim.sub =
  '92000000-0000-4000-8000-000000000001';
set local request.jwt.claims =
  '{"sub":"92000000-0000-4000-8000-000000000001","role":"authenticated"}';

select results_eq(
  $test$
    insert into public.courses (
      id, slug, title, description, level, emoji,
      position, status
    ) values (
      920001, 'teacher-returning-course', 'Teacher course',
      '', 'A1', '', 920001, 'draft'
    )
    returning owner_user_id
  $test$,
  $test$
    values ('92000000-0000-4000-8000-000000000001'::uuid)
  $test$,
  'teacher can create and return an owned draft course'
);

select results_eq(
  $test$
    insert into public.courses (
      id, slug, title, description, level, emoji,
      position, status, owner_user_id
    ) values (
      920002, 'teacher-forced-owner', 'Forced owner course',
      '', 'A1', '', 920002, 'draft',
      '92000000-0000-4000-8000-000000000002'
    )
    returning owner_user_id
  $test$,
  $test$
    values ('92000000-0000-4000-8000-000000000001'::uuid)
  $test$,
  'teacher cannot create a course owned by another user'
);

select is(
  public.can_edit_course(920001),
  true,
  'teacher can edit the newly created owned course'
);

set local request.jwt.claim.sub =
  '92000000-0000-4000-8000-000000000002';
set local request.jwt.claims =
  '{"sub":"92000000-0000-4000-8000-000000000002","role":"authenticated"}';

select is(
  public.can_edit_course(920001),
  false,
  'another teacher cannot edit the course'
);

select results_eq(
  $test$
    update public.courses
    set title = 'Forbidden teacher change'
    where id = 920001
    returning id
  $test$,
  $test$
    select null::bigint where false
  $test$,
  'another teacher cannot update the course through RLS'
);

set local request.jwt.claim.sub =
  '92000000-0000-4000-8000-000000000003';
set local request.jwt.claims =
  '{"sub":"92000000-0000-4000-8000-000000000003","role":"authenticated"}';

select results_eq(
  $test$
    insert into public.courses (
      id, slug, title, description, level, emoji,
      position, status, owner_user_id
    ) values (
      920003, 'administrator-returning-course', 'Administrator course',
      '', 'A1', '', 920003, 'draft',
      '92000000-0000-4000-8000-000000000001'
    )
    returning owner_user_id
  $test$,
  $test$
    values ('92000000-0000-4000-8000-000000000003'::uuid)
  $test$,
  'administrator creation also assigns the authenticated owner'
);

select lives_ok(
  $test$
    update public.courses
    set title = 'Administrator reviewed course'
    where id = 920001
  $test$,
  'administrator retains authority to edit another owner draft course'
);

reset role;
select * from extensions.finish();

rollback;
