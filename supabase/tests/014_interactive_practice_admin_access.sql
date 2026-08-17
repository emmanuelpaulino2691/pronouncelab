begin;

create extension if not exists pgtap
  with schema extensions;

set local search_path =
  public, extensions, pg_catalog;

select plan(13);

select is(
  (
    select count(*)::integer
    from pg_catalog.pg_proc procedure
    join pg_catalog.pg_namespace namespace
      on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and procedure.proname = 'can_manage_content'
      and pg_catalog.pg_get_function_identity_arguments(
        procedure.oid
      ) = ''
      and procedure.prorettype = 'boolean'::regtype
  ),
  1,
  'public.can_manage_content() has one boolean zero-argument signature'
);

select is(
  (
    select count(*)::integer
    from pg_catalog.pg_proc procedure
    join pg_catalog.pg_namespace namespace
      on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and procedure.proname = 'can_access_admin'
  ),
  0,
  'no obsolete can_access_admin overload exists'
);

insert into auth.users (id)
values
  ('91400000-0000-4000-8000-000000000001'),
  ('91400000-0000-4000-8000-000000000002'),
  ('91400000-0000-4000-8000-000000000003'),
  ('91400000-0000-4000-8000-000000000004');

insert into public.user_roles (user_id, role)
values
  (
    '91400000-0000-4000-8000-000000000002',
    'editor'
  ),
  (
    '91400000-0000-4000-8000-000000000003',
    'publisher'
  ),
  (
    '91400000-0000-4000-8000-000000000004',
    'admin'
  );

set local request.jwt.claim.sub =
  '91400000-0000-4000-8000-000000000002';

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
  914001,
  'interactive-practice-access-test',
  'Interactive Practice access test',
  '',
  'A1',
  '',
  914001,
  'draft'
);

insert into public.units (
  id,
  course_id,
  title,
  description,
  position,
  status
)
values (
  914002,
  914001,
  'Unit',
  '',
  0,
  'draft'
);

insert into public.lessons (
  id,
  unit_id,
  title,
  description,
  position,
  status
)
values (
  914003,
  914002,
  'Lesson',
  '',
  0,
  'draft'
);

insert into public.lesson_versions (
  id,
  lesson_id,
  version_number,
  status
)
values (
  914004,
  914003,
  1,
  'draft'
);

insert into public.lesson_activities (
  id,
  lesson_version_id,
  type,
  title,
  position,
  required
)
values (
  914005,
  914004,
  'interactive_practice',
  'Interactive Practice',
  0,
  true
);

insert into public.interactive_practice_exercises (
  id,
  activity_id,
  mode,
  config
)
values (
  914006,
  914005,
  'multiple_choice',
  '{
    "prompt": "",
    "options": [],
    "correctAnswer": null,
    "pairs": [],
    "acceptedAnswers": []
  }'::jsonb
);

set local request.jwt.claim.sub = '';
set local request.jwt.claims = '{"role":"anon"}';
set local role anon;
select results_eq(
  $test$
    select public.can_manage_content()
  $test$,
  array[false]::boolean[],
  'anonymous users cannot access Studio content'
);
select results_eq(
  $test$
    select pg_catalog.has_table_privilege(
      'anon',
      'public.interactive_practice_exercises',
      'select'
    )
  $test$,
  array[false]::boolean[],
  'anonymous users have no direct Interactive Practice table access'
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub =
  '91400000-0000-4000-8000-000000000001';
set local request.jwt.claims =
  '{"sub":"91400000-0000-4000-8000-000000000001","role":"authenticated"}';
select results_eq(
  $test$
    select public.can_manage_content()
  $test$,
  array[false]::boolean[],
  'authenticated learners cannot access Studio content'
);
select is(
  (
    select count(*)::integer
    from public.interactive_practice_exercises
  ),
  0,
  'staff-only Interactive Practice policy hides rows from learners'
);

set local request.jwt.claim.sub =
  '91400000-0000-4000-8000-000000000002';
set local request.jwt.claims =
  '{"sub":"91400000-0000-4000-8000-000000000002","role":"authenticated"}';
select results_eq(
  $test$
    select public.can_manage_content()
  $test$,
  array[true]::boolean[],
  'editors can access Studio content'
);
select is(
  (
    select count(*)::integer
    from public.interactive_practice_exercises
  ),
  1,
  'editor access executes the Interactive Practice RLS policy'
);

set local request.jwt.claim.sub =
  '91400000-0000-4000-8000-000000000003';
set local request.jwt.claims =
  '{"sub":"91400000-0000-4000-8000-000000000003","role":"authenticated"}';
select results_eq(
  $test$
    select public.can_manage_content()
  $test$,
  array[true]::boolean[],
  'publishers can access Studio content'
);

set local request.jwt.claim.sub =
  '91400000-0000-4000-8000-000000000004';
set local request.jwt.claims =
  '{"sub":"91400000-0000-4000-8000-000000000004","role":"authenticated"}';
select results_eq(
  $test$
    select public.can_manage_content()
  $test$,
  array[true]::boolean[],
  'administrators can access Studio content'
);

select set_config(
  'request.jwt.claims',
  '{
    "sub": "91400000-0000-4000-8000-000000000004",
    "role": "authenticated",
    "session_id": "refreshed"
  }',
  true
);
select results_eq(
  $test$
    select public.can_manage_content()
  $test$,
  array[true]::boolean[],
  'same-user token refresh preserves administrator access'
);

create temporary table empty_search_path_result (
  can_manage_content boolean not null
);

set local search_path = '';

insert into pg_temp.empty_search_path_result (can_manage_content)
select public.can_manage_content();

set local search_path = extensions, pg_catalog;

select extensions.results_eq(
  $test$
    select can_manage_content
    from pg_temp.empty_search_path_result
  $test$,
  array[true]::boolean[],
  'schema-qualified helper resolves with an empty search path'
);
select is(
  (
    select count(*)::integer
    from public.interactive_practice_exercises
  ),
  1,
  'RLS policy resolves its schema-qualified helper with an empty search path'
);

reset role;
select * from extensions.finish();

rollback;
