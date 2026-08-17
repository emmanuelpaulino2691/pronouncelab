begin;

create extension if not exists pgtap
  with schema extensions;

set local search_path = public, extensions, pg_catalog;

select plan(4);

select ok(
  to_regprocedure('public.can_edit_lesson_version(bigint)') is not null,
  'central draft-version authorization helper exists'
);

select ok(
  pg_catalog.has_function_privilege(
    'authenticated',
    'public.can_edit_lesson_version(bigint)',
    'EXECUTE'
  ),
  'authenticated users can invoke the draft-version authorization helper'
);

select ok(
  not pg_catalog.has_function_privilege(
    'anon',
    'public.can_edit_lesson_version(bigint)',
    'EXECUTE'
  ),
  'anonymous users cannot invoke the draft-version authorization helper'
);

select ok(
  to_regprocedure('public.create_lesson_draft_version(bigint,bigint)') is not null,
  'version creation remains an RPC-controlled operation'
);

select * from extensions.finish();

rollback;
