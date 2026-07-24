begin;

select plan(5);

select ok(to_regprocedure('public.publish_course(bigint)') is not null, 'publish_course(bigint) exists');
select ok((select pg_get_function_result('public.publish_course(bigint)'::regprocedure) = 'jsonb'), 'publish_course returns jsonb');
select ok(not has_function_privilege('anon', 'public.publish_course(bigint)', 'EXECUTE'), 'anon cannot execute publish_course');
select ok(has_function_privilege('authenticated', 'public.publish_course(bigint)', 'EXECUTE'), 'authenticated can execute publish_course');
select ok((select proconfig @> array['search_path='] from pg_proc where oid = 'public.publish_course(bigint)'::regprocedure), 'publish_course uses an explicit empty search_path');

select * from finish();
rollback;
