begin;

create extension if not exists pgtap
  with schema extensions;

set local search_path =
  public, extensions, pg_catalog;

select plan(7);

select ok(to_regprocedure('public.publish_course(bigint)') is not null, 'publish_course(bigint) exists');
select ok((select pg_get_function_result('public.publish_course(bigint)'::regprocedure) = 'jsonb'), 'publish_course returns jsonb');
select ok(not has_function_privilege('anon', 'public.publish_course(bigint)', 'EXECUTE'), 'anon cannot execute publish_course');
select ok(has_function_privilege('authenticated', 'public.publish_course(bigint)', 'EXECUTE'), 'authenticated can execute publish_course');
select ok(
  not exists (
    select 1
    from pg_catalog.pg_proc procedure
    cross join lateral pg_catalog.aclexplode(
      coalesce(
        procedure.proacl,
        pg_catalog.acldefault('f', procedure.proowner)
      )
    ) privilege
    where procedure.oid =
      'public.publish_course(bigint)'::regprocedure
      and privilege.grantee = 0
      and privilege.privilege_type = 'EXECUTE'
  ),
  'PUBLIC cannot execute publish_course'
);
select ok((select prosecdef from pg_proc where oid = 'public.publish_course(bigint)'::regprocedure), 'publish_course is SECURITY DEFINER');
select is(
  (
    select current_setting
    from pg_catalog.unnest(
      (
        select proconfig
        from pg_catalog.pg_proc
        where oid = 'public.publish_course(bigint)'::regprocedure
      )
    ) as current_setting
    where current_setting like 'search_path=%'
  ),
  'search_path=""',
  'publish_course uses an explicit empty search_path'
);

select * from finish();
rollback;
