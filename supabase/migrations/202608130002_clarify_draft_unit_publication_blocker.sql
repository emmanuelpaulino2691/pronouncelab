begin;

do $$
declare
  definition text;
  updated_definition text;
begin
  select pg_catalog.pg_get_functiondef('public.publish_course(bigint)'::regprocedure)
  into definition;

  -- The linked database already received this wording from 202608130001, while
  -- a clean replay retained the legacy wording because that migration's larger
  -- formatting-sensitive replacement did not match. Reconcile those two known
  -- boundary states without replacing an already-correct function definition.
  if pg_catalog.strpos(
    definition,
    'Add at least one lesson before publishing this new draft unit.'
  ) > 0 then
    if pg_catalog.strpos(
      definition,
      'Add at least one lesson before publishing this unit.'
    ) > 0 then
      raise exception 'Both clarified and legacy draft unit publication messages are present';
    end if;
  elsif pg_catalog.strpos(
    definition,
    'Add at least one lesson before publishing this unit.'
  ) > 0 then
    updated_definition := pg_catalog.replace(
      definition,
      'Add at least one lesson before publishing this unit.',
      'Add at least one lesson before publishing this new draft unit.'
    );
    execute updated_definition;
  else
    raise exception 'Known draft unit publication message was not found';
  end if;
end;
$$;

commit;
