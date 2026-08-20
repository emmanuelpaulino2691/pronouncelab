begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions,pg_catalog;
select plan(12);
insert into auth.users(id,email) values
('93800000-0000-4000-8000-000000000001','teacher@announcements.test'),
('93800000-0000-4000-8000-000000000002','learner@announcements.test'),
('93800000-0000-4000-8000-000000000003','other@announcements.test');
insert into public.user_roles(user_id,role) values('93800000-0000-4000-8000-000000000001','teacher');
insert into public.classes(id,owner_user_id,name,join_code) values(938001,'93800000-0000-4000-8000-000000000001','Announcement Class','9380AAAABBBBCCCC');
insert into public.class_enrollments(class_id,learner_user_id) values(938001,'93800000-0000-4000-8000-000000000002');
reset role;
alter sequence public.class_announcements_id_seq restart with 1;
set local role authenticated;
set local request.jwt.claim.sub='93800000-0000-4000-8000-000000000001';
select lives_ok($$select public.publish_class_announcement(938001,'Unit reminder','Practice Unit 3 Friday.')$$,'owner can publish announcement');
select is(jsonb_array_length(public.get_class_announcements(938001)),1,'owner can list announcement history');
set local request.jwt.claim.sub='93800000-0000-4000-8000-000000000002';
select is((select count(*)::integer from public.learner_notifications where notification_type='new_announcement' and learner_user_id='93800000-0000-4000-8000-000000000002'),1,'active learner receives one announcement notification');
set local request.jwt.claim.sub='93800000-0000-4000-8000-000000000001';
select lives_ok($$select public.edit_class_announcement(1,'Edited reminder','Updated message')$$,'owner can edit announcement');
set local request.jwt.claim.sub='93800000-0000-4000-8000-000000000002';
select is((select count(*)::integer from public.learner_notifications where notification_type='new_announcement'),1,'editing does not create a second notification');
set local request.jwt.claim.sub='93800000-0000-4000-8000-000000000002';
select is(jsonb_array_length(public.get_class_announcements(938001)),1,'active learner can read Class announcement');
select lives_ok($$select public.mark_class_announcement_read(1)$$,'learner can mark own announcement read');
reset role;
select is((select count(*)::integer from public.class_announcement_reads where announcement_id=1 and learner_user_id='93800000-0000-4000-8000-000000000002'),1,'announcement read state is learner-specific');
set local role authenticated;
set local request.jwt.claim.sub='93800000-0000-4000-8000-000000000002';
select set_config('request.jwt.claim.sub','93800000-0000-4000-8000-000000000003',true);
select throws_ok($$select public.mark_class_announcement_read(1)$$,'Announcement is unavailable','other learner cannot mark announcement read');
set local request.jwt.claim.sub='93800000-0000-4000-8000-000000000001';
select lives_ok($$select public.withdraw_class_announcement(1)$$,'owner can withdraw announcement');
set local request.jwt.claim.sub='93800000-0000-4000-8000-000000000002';
select is(jsonb_array_length(public.get_class_announcements(938001)),0,'withdrawn announcement is hidden from learner feed');
select is((select count(*)::integer from public.learner_notifications where notification_type='new_announcement'),0,'withdrawn notification history is hidden from learner RLS');
select * from finish();
rollback;
