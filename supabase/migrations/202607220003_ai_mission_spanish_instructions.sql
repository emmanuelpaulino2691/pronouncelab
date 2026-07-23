begin;

alter function public.is_valid_ai_speaking_mission_config(jsonb)
  rename to is_valid_ai_speaking_mission_config_v1_base;

create function public.is_valid_ai_speaking_mission_config(
  requested_config jsonb
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select
    public.is_valid_ai_speaking_mission_config_v1_base(
      requested_config - 'studentInstructionsEs'
    )
    and (
      not (requested_config ? 'studentInstructionsEs')
      or (
        pg_catalog.jsonb_typeof(
          requested_config -> 'studentInstructionsEs'
        ) = 'string'
        and pg_catalog.btrim(
          requested_config ->> 'studentInstructionsEs'
        ) <> ''
        and pg_catalog.char_length(
          requested_config ->> 'studentInstructionsEs'
        ) <= 5000
      )
    );
$$;

revoke all on function
  public.is_valid_ai_speaking_mission_config_v1_base(jsonb)
  from public, anon, authenticated;
revoke all on function
  public.is_valid_ai_speaking_mission_config(jsonb)
  from public, anon, authenticated;

alter table public.ai_speaking_missions
  drop constraint ai_speaking_missions_complete_config,
  add constraint ai_speaking_missions_complete_config
    check (
      public.is_valid_ai_speaking_mission_config(config)
    );

-- The learner projection intentionally exposes only approved mission fields.
-- Extend that allow-list without changing the RPC signature or other activity
-- projections. The assertion makes a later source-format change fail loudly.
do $$
declare
  projection_definition text;
  original_fragment constant text :=
    $fragment$'studentInstructions',
            mission.config -> 'studentInstructions'
        )$fragment$;
  replacement_fragment constant text :=
    $fragment$'studentInstructions',
            mission.config -> 'studentInstructions'
        ) || case
          when mission.config ? 'studentInstructionsEs' then
            pg_catalog.jsonb_build_object(
              'studentInstructionsEs',
              mission.config -> 'studentInstructionsEs'
            )
          else '{}'::jsonb
        end$fragment$;
begin
  select pg_catalog.pg_get_functiondef(routine.oid)
  into projection_definition
  from pg_catalog.pg_proc as routine
  join pg_catalog.pg_namespace as namespace
    on namespace.oid = routine.pronamespace
  where namespace.nspname = 'public'
    and routine.proname = 'learner_published_activity_projection'
    and pg_catalog.pg_get_function_identity_arguments(routine.oid) =
      'requested_activity_id bigint';

  if projection_definition is null
    or pg_catalog.strpos(
      projection_definition,
      original_fragment
    ) = 0
  then
    raise exception
      'Unable to extend the published AI mission projection safely';
  end if;

  execute pg_catalog.replace(
    projection_definition,
    original_fragment,
    replacement_fragment
  );
end;
$$;

commit;
