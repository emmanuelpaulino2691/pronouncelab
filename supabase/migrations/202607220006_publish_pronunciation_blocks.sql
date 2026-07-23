-- Preserve the original published-only hierarchy checks while extending the
-- learner projection with the optional pronunciation block fields introduced
-- after the first published-delivery contract.

alter function public.get_published_lesson(bigint, integer)
  rename to get_published_lesson_base_v1;

revoke all on function
  public.get_published_lesson_base_v1(bigint, integer)
  from public, anon, authenticated, service_role;

create or replace function public.learner_pronunciation_activity_v2(
  published_activity jsonb
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when published_activity ->> 'type' <> 'pronunciation' then
      published_activity
    else
      pg_catalog.jsonb_set(
        published_activity,
        '{items}',
        coalesce(
          (
            select pg_catalog.jsonb_agg(
              published_item || pg_catalog.jsonb_build_object(
                'blockType', item.block_type,
                'spellingPattern', item.spelling_pattern,
                'entries', item.entries
              )
              order by item.position, item.id
            )
            from pg_catalog.jsonb_array_elements(
              coalesce(published_activity -> 'items', '[]'::jsonb)
            ) as projected(published_item)
            join public.pronunciation_items as item
              on item.id = (projected.published_item ->> 'id')::bigint
          ),
          '[]'::jsonb
        ),
        true
      )
  end;
$$;

revoke all on function
  public.learner_pronunciation_activity_v2(jsonb)
  from public, anon, authenticated, service_role;

create or replace function public.get_published_lesson(
  requested_lesson_id bigint,
  requested_schema_version integer
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with base as (
    select public.get_published_lesson_base_v1(
      requested_lesson_id,
      requested_schema_version
    ) as payload
  )
  select case
    when base.payload -> 'lesson' is null then base.payload
    else pg_catalog.jsonb_set(
      base.payload,
      '{lesson,activities}',
      coalesce(
        (
          select pg_catalog.jsonb_agg(
            public.learner_pronunciation_activity_v2(activity)
            order by ordinal
          )
          from pg_catalog.jsonb_array_elements(
            coalesce(base.payload #> '{lesson,activities}', '[]'::jsonb)
          ) with ordinality as projected(activity, ordinal)
        ),
        '[]'::jsonb
      ),
      true
    )
  end
  from base;
$$;

revoke all on function
  public.get_published_lesson(bigint, integer)
  from public, anon, authenticated, service_role;

grant execute on function
  public.get_published_lesson(bigint, integer)
  to anon, authenticated;

comment on function public.get_published_lesson(bigint, integer) is
  'Returns one learner-safe published lesson, including optional pronunciation block fields.';
