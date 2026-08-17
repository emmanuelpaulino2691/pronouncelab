begin;

create or replace function public.validate_lesson_version_listening_audio(
  requested_lesson_version_id bigint
)
returns void
language plpgsql
set search_path = ''
as $$
declare
  invalid_item_id bigint;
begin
  perform public.lock_content_hierarchy_gate();

  select listening.id
  into invalid_item_id
  from public.listening_items as listening
  join public.lesson_activities as activity
    on activity.id = listening.activity_id
  where activity.lesson_version_id = requested_lesson_version_id
    and activity.type = 'listening'
    and listening.audio_asset_id is null
  order by listening.id
  limit 1
  for update of listening, activity;

  if found then
    raise exception
      'Invalid publication content: listening item % requires audio',
      invalid_item_id;
  end if;
end;
$$;

revoke all on function
  public.validate_lesson_version_listening_audio(bigint)
  from public, anon, authenticated;

create or replace function public.publish_lesson_version(
  requested_lesson_version_id bigint
)
returns public.lesson_versions
language plpgsql
security definer
set search_path = ''
as $$
declare
  version_row public.lesson_versions%rowtype;
  published_version public.lesson_versions%rowtype;
begin
  if not public.can_publish_content() then
    raise exception
      'Publisher or administrator role required';
  end if;

  perform public.lock_content_hierarchy_gate();

  select *
  into version_row
  from public.lesson_versions
  where id = requested_lesson_version_id
  for update;

  if not found then
    raise exception 'Lesson version does not exist';
  end if;

  if version_row.status <> 'draft' then
    raise exception
      'Only a draft lesson version can be published';
  end if;

  perform public.validate_lesson_version_listening_audio(
    version_row.id
  );
  perform public.validate_lesson_version_media(
    version_row.id
  );
  perform public.validate_lesson_version_ai_missions(
    version_row.id
  );

  perform pg_catalog.set_config(
    'pronouncelab.lesson_publication',
    'on',
    true
  );

  update public.lesson_versions
  set status = 'published',
    published_by = auth.uid(),
    published_at = now()
  where id = version_row.id
    and status = 'draft'
  returning * into published_version;

  if not found then
    raise exception
      'Lesson version changed during publication';
  end if;

  return published_version;
end;
$$;

revoke all on function
  public.publish_lesson_version(bigint)
  from public;
grant execute on function
  public.publish_lesson_version(bigint)
  to authenticated;

commit;
