begin;

do $$
declare
  definition text;
  updated_definition text;
begin
  select pg_catalog.pg_get_functiondef('public.publish_course(bigint)'::regprocedure)
  into definition;
  updated_definition := pg_catalog.replace(
    definition,
    'Add at least one lesson before publishing this unit.',
    'Add at least one lesson before publishing this new draft unit.'
  );
  if updated_definition = definition then
    raise exception 'Expected draft unit publication message was not found';
  end if;
  execute updated_definition;
end;
$$;

commit;
