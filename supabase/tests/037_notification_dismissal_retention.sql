begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions,pg_catalog;
select plan(11);

insert into auth.users(id,email) values
('93700000-0000-4000-8000-000000000001','teacher@retention.test'),
('93700000-0000-4000-8000-000000000002','learner@retention.test'),
('93700000-0000-4000-8000-000000000003','other@retention.test');
insert into public.user_roles(user_id,role) values('93700000-0000-4000-8000-000000000001','teacher');
set local role authenticated;
set local request.jwt.claim.sub='93700000-0000-4000-8000-000000000001';
insert into public.courses(id,slug,title,position,status,owner_user_id) values(937001,'retention','Retention',937001,'draft','93700000-0000-4000-8000-000000000001');
reset role;
insert into public.course_releases(id,course_id,owner_user_id,release_number,course_slug,course_title,course_description,course_level,course_emoji,content_fingerprint) values(937002,937001,'93700000-0000-4000-8000-000000000001',1,'retention','Retention Course','','A1','',repeat('a',64));
insert into public.classes(id,owner_user_id,name,join_code) values(937003,'93700000-0000-4000-8000-000000000001','Retention Class','9370AAAABBBBCCCC');
insert into public.class_enrollments(class_id,learner_user_id) values(937003,'93700000-0000-4000-8000-000000000002'),(937003,'93700000-0000-4000-8000-000000000003');
insert into public.class_course_assignments(id,class_id,course_release_id,source_course_id,assigned_by,available_at,due_at) values(937004,937003,937002,937001,'93700000-0000-4000-8000-000000000001',now()+interval '1 day',now()+interval '10 days');
insert into public.learner_notifications(id,learner_user_id,notification_type,class_id,assignment_id,course_release_id,title,body,event_key,created_at,read_at) values
(937010,'93700000-0000-4000-8000-000000000002','new_assignment',937003,937004,937002,'Old read','Old read','retention:old-read',now()-interval '100 days',now()-interval '100 days'),
(937011,'93700000-0000-4000-8000-000000000002','new_assignment',937003,937004,937002,'Old unread','Old unread','retention:old-unread',now()-interval '100 days',null),
(937012,'93700000-0000-4000-8000-000000000002','new_assignment',937003,937004,937002,'Recent read','Recent read','retention:recent-read',now()-interval '1 day',now()-interval '1 hour'),
(937013,'93700000-0000-4000-8000-000000000002','new_assignment',937003,937004,937002,'Recent unread','Recent unread','retention:recent-unread',now()-interval '1 day',null),
(937014,'93700000-0000-4000-8000-000000000003','new_assignment',937003,937004,937002,'Other','Other','retention:other',now(),null);

set local role authenticated;
set local request.jwt.claim.sub='93700000-0000-4000-8000-000000000002';
select is(jsonb_array_length(public.get_my_notifications(50)),3,'old read notifications are hidden while old unread remains visible');
select lives_ok($$select public.dismiss_notification(937013)$$,'learner can dismiss own notification');
select is(jsonb_array_length(public.get_my_notifications(50)),2,'dismissed notification leaves default listing');
select is((select count(*)::integer from public.learner_notifications where id=937013 and dismissed_at is null),0,'dismissed unread no longer contributes to inbox or badge');
select lives_ok($$select public.dismiss_notification(937014)$$,'dismissing another learner notification is safely ignored');
reset role;
select is((select count(*)::integer from public.learner_notifications where id=937014 and dismissed_at is null),1,'learner cannot dismiss another learner notification');
set local role authenticated;
set local request.jwt.claim.sub='93700000-0000-4000-8000-000000000002';
select lives_ok($$select public.clear_read_notifications()$$,'learner can clear read notifications');
select is((select count(*)::integer from public.learner_notifications where learner_user_id=auth.uid() and dismissed_at is null and read_at is not null),0,'clear read preserves no visible read rows');
select is((select count(*)::integer from public.learner_notifications where id=937011 and dismissed_at is null),1,'clear read preserves unread notifications');
reset role;
select is(public.process_assignment_notifications_at(now()+interval '2 days'),2,'processor creates available events for active enrolled learners');
update public.learner_notifications set dismissed_at=now() where assignment_id=937004 and notification_type='assignment_available';
select is(public.process_assignment_notifications_at(now()+interval '2 days'),0,'dismissal and event keys keep processing idempotent');
select * from finish();
rollback;
