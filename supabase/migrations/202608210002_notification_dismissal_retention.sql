begin;

alter table public.learner_notifications
  add column dismissed_at timestamptz;

create index learner_notifications_visible_idx
  on public.learner_notifications(learner_user_id, created_at desc)
  where dismissed_at is null;

-- The event row is retained permanently for deduplication. Dismissal only
-- removes it from the learner's normal inbox.
create or replace function public.get_my_notifications(requested_limit integer default 50)
returns jsonb language sql stable security definer set search_path='' as $$
  select coalesce(jsonb_agg(item order by item->>'createdAt' desc), '[]'::jsonb)
  from (
    select jsonb_build_object('id',n.id,'type',n.notification_type,'classId',n.class_id,'assignmentId',n.assignment_id,'releaseId',n.course_release_id,'title',n.title,'body',n.body,'metadata',n.metadata,'createdAt',n.created_at,'readAt',n.read_at) as item
    from public.learner_notifications n
    where n.learner_user_id=auth.uid()
      and n.dismissed_at is null
      and (n.read_at is null or n.read_at > pg_catalog.now() - interval '90 days')
    order by n.created_at desc
    limit least(greatest(coalesce(requested_limit,50),1),100)
  ) items;
$$;

create or replace function public.dismiss_notification(requested_notification_id bigint)
returns void language sql security definer set search_path='' as $$
  update public.learner_notifications
  set dismissed_at=coalesce(dismissed_at,pg_catalog.now())
  where id=requested_notification_id and learner_user_id=auth.uid();
$$;

create or replace function public.clear_read_notifications()
returns void language sql security definer set search_path='' as $$
  update public.learner_notifications
  set dismissed_at=coalesce(dismissed_at,pg_catalog.now())
  where learner_user_id=auth.uid() and read_at is not null and dismissed_at is null;
$$;

revoke all on function public.dismiss_notification(bigint), public.clear_read_notifications() from public,anon;
grant execute on function public.dismiss_notification(bigint), public.clear_read_notifications() to authenticated;

commit;
