begin;

create extension if not exists pgtap
  with schema extensions;

set local search_path =
  public, extensions, pg_catalog;

select plan(11);

insert into auth.users (id)
values
  ('91800000-0000-4000-8000-000000000001'),
  ('91800000-0000-4000-8000-000000000002'),
  ('91800000-0000-4000-8000-000000000003');

insert into public.user_roles (user_id, role)
values
  ('91800000-0000-4000-8000-000000000001', 'teacher'),
  ('91800000-0000-4000-8000-000000000002', 'teacher'),
  ('91800000-0000-4000-8000-000000000003', 'admin');

set local role authenticated;
set local request.jwt.claim.sub =
  '91800000-0000-4000-8000-000000000001';

select lives_ok(
  $test$
    insert into public.courses (
      id, slug, title, description, level, emoji,
      position, status
    ) values (
      918001, 'ownership-trigger-one', 'Teacher one course',
      '', 'A1', '', 918001, 'draft'
    )
  $test$,
  'teacher course creation does not crash the ownership trigger'
);

select is(
  (select owner_user_id from public.courses where id = 918001),
  '91800000-0000-4000-8000-000000000001'::uuid,
  'course creation assigns the authenticated owner'
);

select lives_ok(
  $test$
    update public.courses
    set title = 'Owner updated course'
    where id = 918001
  $test$,
  'the course owner can update owned course metadata'
);

select throws_ok(
  $test$
    update public.courses
    set owner_user_id =
      '91800000-0000-4000-8000-000000000002'
    where id = 918001
  $test$,
  'Course ownership is immutable',
  'course ownership cannot be reassigned'
);

select lives_ok(
  $test$
    insert into public.units (
      id, course_id, title, description, position, status
    ) values (
      918011, 918001, 'Owned unit', '', 0, 'draft'
    )
  $test$,
  'owner can insert child content without a child owner column'
);

select lives_ok(
  $test$
    update public.units
    set title = 'Owner updated unit'
    where id = 918011
  $test$,
  'owner can update child content without a child owner column'
);

reset role;

select is(
  public.content_row_course_id(
    'units',
    pg_catalog.jsonb_build_object(
      'id', 918011,
      'course_id', 918001
    )
  ),
  918001::bigint,
  'child ownership resolves to the authoritative course'
);

set local role authenticated;
set local request.jwt.claim.sub =
  '91800000-0000-4000-8000-000000000002';

select is(
  (
    with changed as (
      update public.units
      set title = 'Forbidden teacher update'
      where id = 918011
      returning id
    )
    select count(*)::integer from changed
  ),
  0,
  'a teacher cannot update another teacher child hierarchy'
);

select is(
  (
    with changed as (
      update public.courses
      set title = 'Forbidden cross-owner update'
      where id = 918001
      returning id
    )
    select count(*)::integer from changed
  ),
  0,
  'a teacher cannot update another teacher course'
);

set local request.jwt.claim.sub =
  '91800000-0000-4000-8000-000000000003';

select lives_ok(
  $test$
    update public.units
    set title = 'Administrator reviewed unit'
    where id = 918011
  $test$,
  'administrator can update another owner child hierarchy'
);

select throws_ok(
  $test$
    update public.courses
    set owner_user_id =
      '91800000-0000-4000-8000-000000000003'
    where id = 918001
  $test$,
  'Course ownership is immutable',
  'administrator authority does not permit ownership reassignment'
);

reset role;
select * from extensions.finish();

rollback;
