begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions,pg_catalog;
select plan(18);

insert into auth.users(id,email) values
('92800000-0000-4000-8000-000000000001','teacher-a@test.local'),
('92800000-0000-4000-8000-000000000002','teacher-b@test.local'),
('92800000-0000-4000-8000-000000000003','learner-a@test.local'),
('92800000-0000-4000-8000-000000000004','learner-b@test.local'),
('92800000-0000-4000-8000-000000000005','admin@test.local');
insert into public.user_roles(user_id,role) values
('92800000-0000-4000-8000-000000000001','teacher'),
('92800000-0000-4000-8000-000000000002','teacher'),
('92800000-0000-4000-8000-000000000005','admin');
truncate table public.class_enrollments, public.classes restart identity;

set local role authenticated;
set local request.jwt.claim.sub='92800000-0000-4000-8000-000000000001';
select lives_ok($$select public.create_class('Teacher A Class','Test')$$,'teacher creates class');
select is((select owner_user_id from public.classes limit 1),'92800000-0000-4000-8000-000000000001'::uuid,'class belongs to teacher');
select matches((select join_code from public.classes limit 1),'^[A-F0-9]{16}$','join code is opaque 64-bit hex');
reset role;
update public.classes set join_code='ABCDEF0123456789' where id=1;

set local role authenticated;
set local request.jwt.claim.sub='92800000-0000-4000-8000-000000000002';
select is((select count(*)::integer from public.classes),0,'Teacher B cannot see Teacher A class');
select throws_ok($$select public.update_owned_class(1,'Stolen','', 'active')$$,'Class is unavailable','Teacher B cannot mutate Teacher A class');

set local request.jwt.claim.sub='92800000-0000-4000-8000-000000000003';
select throws_ok($$select public.create_class('Learner class','')$$,'Teacher access is required','learner cannot create class');
select lives_ok($$select public.join_class('ABCDEF0123456789')$$,'learner joins valid class');
select lives_ok($$select public.join_class('ABCDEF0123456789')$$,'duplicate join is idempotent');
select is((select count(*)::integer from public.class_enrollments),1,'learner sees one own membership');
select is((select count(*)::integer from public.class_enrollments where learner_user_id='92800000-0000-4000-8000-000000000004'),0,'learner cannot see another enrollment');

set local request.jwt.claim.sub='92800000-0000-4000-8000-000000000001';
select is(jsonb_array_length(public.get_owned_class_roster(1)),1,'owner sees roster');
select lives_ok($$select public.set_class_enrollment_active(1,'92800000-0000-4000-8000-000000000003',false)$$,'teacher removes enrollment softly');
select is(jsonb_array_length(public.get_enrolled_learner_progress_summary(1)),0,'inactive enrollment grants no progress visibility');

set local request.jwt.claim.sub='92800000-0000-4000-8000-000000000003';
select lives_ok($$select public.join_class('ABCDEF0123456789')$$,'removed learner can rejoin');

set local request.jwt.claim.sub='92800000-0000-4000-8000-000000000001';
select lives_ok($$select public.update_owned_class(1,'Teacher A Class','Archived','archived')$$,'owner archives class');
set local request.jwt.claim.sub='92800000-0000-4000-8000-000000000004';
select throws_ok($$select public.join_class('ABCDEF0123456789')$$,'Join code is invalid or unavailable','archived class rejects joins');
set local request.jwt.claim.sub='92800000-0000-4000-8000-000000000005';
select is((select count(*)::integer from public.classes),1,'admin can support all classes');
set local request.jwt.claim.sub='92800000-0000-4000-8000-000000000001';
select throws_ok($$select public.join_class('INVALID')$$,'Learner authentication is required','staff cannot enroll as learner');

select * from finish();
rollback;
