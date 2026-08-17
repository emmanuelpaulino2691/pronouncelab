begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions,pg_catalog;
select plan(30);

insert into auth.users(id,email) values
('93000000-0000-4000-8000-000000000001','teacher-a@assignment.test'),
('93000000-0000-4000-8000-000000000002','teacher-b@assignment.test'),
('93000000-0000-4000-8000-000000000003','learner-a@assignment.test'),
('93000000-0000-4000-8000-000000000004','learner-b@assignment.test'),
('93000000-0000-4000-8000-000000000005','admin@assignment.test');
insert into public.user_roles(user_id,role) values
('93000000-0000-4000-8000-000000000001','teacher'),('93000000-0000-4000-8000-000000000002','teacher'),('93000000-0000-4000-8000-000000000005','admin');
set local request.jwt.claim.sub='93000000-0000-4000-8000-000000000001';
insert into public.courses(id,slug,title,position,status,owner_user_id) values
(930001,'assignment-a','Course A',930001,'draft','93000000-0000-4000-8000-000000000001'),
(930003,'assignment-c','Course C',930003,'draft','93000000-0000-4000-8000-000000000001');
set local request.jwt.claim.sub='93000000-0000-4000-8000-000000000002';
insert into public.courses(id,slug,title,position,status,owner_user_id) values
(930002,'assignment-b','Course B',930002,'draft','93000000-0000-4000-8000-000000000002');
set local request.jwt.claim.sub='93000000-0000-4000-8000-000000000005';
insert into public.units(id,course_id,title,position,status) values(930011,930001,'Unit A',0,'draft'),(930012,930002,'Unit B',0,'draft'),(930013,930003,'Unit C',0,'draft');
insert into public.lessons(id,unit_id,title,position,status) values(930021,930011,'Lesson A',0,'draft'),(930022,930012,'Lesson B',0,'draft'),(930023,930013,'Lesson C',0,'draft');
insert into public.lesson_versions(id,lesson_id,version_number,status,created_by) values
(930031,930021,1,'draft','93000000-0000-4000-8000-000000000001'),(930032,930021,2,'draft','93000000-0000-4000-8000-000000000001'),
(930033,930022,1,'draft','93000000-0000-4000-8000-000000000002'),(930034,930023,1,'draft','93000000-0000-4000-8000-000000000001');
insert into public.lesson_activities(id,lesson_version_id,type,title,position) values(930041,930031,'theory','A1',0),(930042,930032,'theory','A2',0),(930043,930033,'theory','B1',0),(930044,930034,'theory','C1',0);
insert into public.course_releases(id,course_id,owner_user_id,release_number,course_slug,course_title,course_description,course_level,course_emoji,content_fingerprint) values
(930051,930001,'93000000-0000-4000-8000-000000000001',1,'assignment-a','Course A','','A1','A',repeat('a',64)),
(930052,930001,'93000000-0000-4000-8000-000000000001',2,'assignment-a','Course A','','A1','A',repeat('b',64)),
(930053,930002,'93000000-0000-4000-8000-000000000002',1,'assignment-b','Course B','','A1','B',repeat('c',64)),
(930054,930003,'93000000-0000-4000-8000-000000000001',1,'assignment-c','Course C','','A1','C',repeat('d',64));
insert into public.course_release_units(id,course_release_id,source_unit_id,position,title,description) values(930061,930051,930011,0,'Unit A',''),(930062,930052,930011,0,'Unit A',''),(930063,930053,930012,0,'Unit B',''),(930064,930054,930013,0,'Unit C','');
insert into public.course_release_lessons(id,course_release_unit_id,source_lesson_id,lesson_version_id,position,title,description) values(930071,930061,930021,930031,0,'Lesson A',''),(930072,930062,930021,930032,0,'Lesson A',''),(930073,930063,930022,930033,0,'Lesson B',''),(930074,930064,930023,930034,0,'Lesson C','');
insert into public.classes(id,owner_user_id,name,join_code) values
(930081,'93000000-0000-4000-8000-000000000001','Class A','AAAABBBBCCCCDDDD'),
(930082,'93000000-0000-4000-8000-000000000001','Class A2','AAAABBBBCCCCEEEE'),
(930083,'93000000-0000-4000-8000-000000000002','Class B','AAAABBBBCCCCFFFF');
insert into public.class_enrollments(class_id,learner_user_id) values(930081,'93000000-0000-4000-8000-000000000003'),(930082,'93000000-0000-4000-8000-000000000003');
grant execute on function public.can_access_course_release(bigint) to authenticated;

set local role authenticated; set local request.jwt.claim.sub='93000000-0000-4000-8000-000000000001';
select lives_ok($$select public.assign_class_course_release(930081,930051)$$,'Teacher A assigns own Release to own Class');
select is((select count(*)::integer from public.class_course_assignments where class_id=930081 and status='active'),1,'one active assignment created');
select is(public.assign_class_course_release(930081,930051),public.assign_class_course_release(930081,930051),'duplicate same Release is idempotent');
select lives_ok($$select public.assign_class_course_release(930081,930054)$$,'multiple Courses can be assigned');
select is(jsonb_array_length(public.get_class_course_assignments(930081)),2,'owner lists active assignments');
select is(jsonb_array_length(public.list_assignable_course_releases()),3,'Teacher sees only own Releases');

set local request.jwt.claim.sub='93000000-0000-4000-8000-000000000002';
select throws_ok($$select public.assign_class_course_release(930081,930053)$$,'Active Class is unavailable','Teacher B cannot assign to Teacher A Class');
set local request.jwt.claim.sub='93000000-0000-4000-8000-000000000001';
select throws_ok($$select public.assign_class_course_release(930081,930053)$$,'Course Release is unavailable','Teacher A cannot assign Teacher B Release');

set local request.jwt.claim.sub='93000000-0000-4000-8000-000000000003';
select throws_ok($$select public.assign_class_course_release(930081,930052)$$,'Active Class is unavailable','Learner cannot mutate assignment');
select ok(public.can_access_course_release(930051),'active enrollment and assignment grant Release access');
select is(jsonb_array_length(public.get_class_course_assignments(930081)),2,'learner lists active assigned Courses');
set local request.jwt.claim.sub='93000000-0000-4000-8000-000000000004';
select ok(not public.can_access_course_release(930051),'unenrolled learner denied Release');

set local request.jwt.claim.sub='93000000-0000-4000-8000-000000000001';
select lives_ok($$select public.assign_class_course_release(930081,930052)$$,'Release update succeeds atomically');
select is((select count(*)::integer from public.class_course_assignments where class_id=930081 and source_course_id=930001 and status='active'),1,'only one Course Release remains active');
select is((select course_release_id from public.class_course_assignments where class_id=930081 and source_course_id=930001 and status='active'),930052::bigint,'new Release is pinned');
select is((select count(*)::integer from public.class_course_assignments where class_id=930081 and source_course_id=930001 and status='inactive'),1,'Release 1 assignment history preserved');
select lives_ok($$select public.assign_class_course_release(930082,930051)$$,'second Class assigns same Release');

set local request.jwt.claim.sub='93000000-0000-4000-8000-000000000003';
select ok(public.can_access_course_release(930051),'second Class preserves Release 1 access');
reset role; update public.class_enrollments set status='inactive',ended_at=now() where class_id=930082;
set local role authenticated; set local request.jwt.claim.sub='93000000-0000-4000-8000-000000000003';
select ok(not public.can_access_course_release(930051),'inactive final enrollment removes Release 1 access');
reset role; update public.class_enrollments set status='active',ended_at=null where class_id=930082;
set local role authenticated; set local request.jwt.claim.sub='93000000-0000-4000-8000-000000000003';
select ok(public.can_access_course_release(930051),'enrollment reactivation restores access');

reset role; insert into public.learner_release_lesson_progress(learner_id,course_release_lesson_id,completed_at) values('93000000-0000-4000-8000-000000000003',930072,now());
insert into public.learner_lesson_progress(learner_id,lesson_id,completed_at) values('93000000-0000-4000-8000-000000000003',930021,now());
set local role authenticated; set local request.jwt.claim.sub='93000000-0000-4000-8000-000000000001';
select is((public.get_class_assignment_progress((select id from public.class_course_assignments where class_id=930081 and course_release_id=930052))#>>'{learners,0,completedLessons}')::integer,1,'report counts assigned Release completion');
select is((public.get_class_assignment_progress((select id from public.class_course_assignments where class_id=930081 and course_release_id=930052))#>>'{learners,0,completionPercent}')::numeric,100::numeric,'completion percentage deterministic');
select is((public.get_class_assignment_progress((select id from public.class_course_assignments where class_id=930081 and course_release_id=930054))#>>'{learners,0,completedLessons}')::integer,0,'different Release progress excluded');
select is((public.get_class_assignment_progress((select id from public.class_course_assignments where class_id=930081 and course_release_id=930054))#>>'{learners,0,startedLessons}')::integer,0,'public current progress excluded');
create temporary table assignment_test_id as select id from public.class_course_assignments where class_id=930081 order by id limit 1;
grant select on assignment_test_id to authenticated;
set local request.jwt.claim.sub='93000000-0000-4000-8000-000000000002';
select throws_ok(format('select public.get_class_assignment_progress(%s)',(select id from assignment_test_id)),'Assignment is unavailable','Teacher B cannot run Teacher A report');

reset role; update public.classes set status='archived' where id=930081;
set local role authenticated; set local request.jwt.claim.sub='93000000-0000-4000-8000-000000000003';
select ok(not public.can_access_course_release(930052),'archived Class removes assignment access');
set local request.jwt.claim.sub='93000000-0000-4000-8000-000000000001';
select throws_ok($$select public.assign_class_course_release(930081,930051)$$,'Active Class is unavailable','archived Class rejects assignment');
select lives_ok(format('select public.deactivate_class_course_assignment(%s)',(select id from public.class_course_assignments where class_id=930081 and course_release_id=930054)),'assignment deactivation succeeds');
reset role;
select is((select count(*)::integer from public.learner_release_lesson_progress where learner_id='93000000-0000-4000-8000-000000000003'),1,'deactivation does not delete learner progress');

set local role anon; set local request.jwt.claim.sub='';
select throws_ok($$select public.get_class_course_assignments(930081)$$,'permission denied for function get_class_course_assignments','anonymous denied');
select * from finish(); rollback;
