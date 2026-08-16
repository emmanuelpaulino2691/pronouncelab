begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions,pg_catalog;
select plan(27);

insert into auth.users(id,email) values
('93300000-0000-4000-8000-000000000001','owner@removal.test'),
('93300000-0000-4000-8000-000000000002','other@removal.test'),
('93300000-0000-4000-8000-000000000003','learner@removal.test');
insert into public.user_roles(user_id,role) values
('93300000-0000-4000-8000-000000000001','teacher'),
('93300000-0000-4000-8000-000000000002','teacher');

set local request.jwt.claim.sub='93300000-0000-4000-8000-000000000001';
insert into public.courses(id,slug,title,position,status,published_at,owner_user_id,learner_visibility) values
(933001,'removal-course','Removal Course',933001,'published',now(),'93300000-0000-4000-8000-000000000001','unlisted'),
(933002,'draft-removal-course','Draft Removal Course',933002,'draft',null,'93300000-0000-4000-8000-000000000001','class_only');
insert into public.units(id,course_id,title,position,status,published_at) values
(933011,933001,'Unit 1',0,'published',now()),
(933012,933001,'Unit 2',1,'published',now()),
(933013,933002,'Draft Unit',0,'draft',null);
insert into public.lessons(id,unit_id,title,position,status,published_at) values
(933021,933011,'Lesson A',0,'published',now()),
(933022,933011,'Lesson B',1,'published',now()),
(933023,933011,'Lesson C',2,'published',now()),
(933024,933011,'Lesson D',3,'published',now()),
(933025,933012,'Lesson E',0,'published',now()),
(933026,933013,'Draft Lesson',0,'draft',null);
insert into public.lesson_versions(id,lesson_id,version_number,status,published_at,created_by,published_by) values
(933031,933021,1,'published',now(),'93300000-0000-4000-8000-000000000001','93300000-0000-4000-8000-000000000001'),
(933032,933022,1,'published',now(),'93300000-0000-4000-8000-000000000001','93300000-0000-4000-8000-000000000001'),
(933033,933023,1,'published',now(),'93300000-0000-4000-8000-000000000001','93300000-0000-4000-8000-000000000001'),
(933034,933024,1,'published',now(),'93300000-0000-4000-8000-000000000001','93300000-0000-4000-8000-000000000001'),
(933035,933025,1,'published',now(),'93300000-0000-4000-8000-000000000001','93300000-0000-4000-8000-000000000001'),
(933036,933026,1,'draft',null,'93300000-0000-4000-8000-000000000001',null);
update public.lessons set current_published_version_id=case id when 933021 then 933031 when 933022 then 933032 when 933023 then 933033 when 933024 then 933034 when 933025 then 933035 end where id between 933021 and 933025;

-- Release 1 predates progressive Lesson D.
insert into public.course_releases(id,course_id,owner_user_id,release_number,course_slug,course_title,course_description,course_level,course_emoji,content_fingerprint)
values(933051,933001,'93300000-0000-4000-8000-000000000001',1,'removal-course','Removal Course','','A1','',repeat('a',64));
insert into public.course_release_units(id,course_release_id,source_unit_id,position,title,description) values
(933061,933051,933011,0,'Unit 1',''),(933062,933051,933012,1,'Unit 2','');
insert into public.course_release_lessons(id,course_release_unit_id,source_lesson_id,lesson_version_id,position,title,description) values
(933071,933061,933021,933031,0,'Lesson A',''),(933072,933061,933022,933032,1,'Lesson B',''),
(933073,933061,933023,933033,2,'Lesson C',''),(933075,933062,933025,933035,0,'Lesson E','');
insert into public.learner_release_lesson_progress(learner_id,course_release_lesson_id,completed_at)
values('93300000-0000-4000-8000-000000000003',933072,now());
insert into public.classes(id,owner_user_id,name,join_code) values
(933081,'93300000-0000-4000-8000-000000000001','Removal Class','9330AAAABBBBCCCC');
insert into public.class_enrollments(class_id,learner_user_id) values
(933081,'93300000-0000-4000-8000-000000000003');
insert into public.class_course_assignments(id,class_id,course_release_id,source_course_id,assigned_by)
values(933091,933081,933051,933001,'93300000-0000-4000-8000-000000000001');
insert into public.course_unlisted_share_links(course_id,token_hash,created_by)
values(933001,repeat('b',64),'93300000-0000-4000-8000-000000000001');
insert into public.learner_independent_course_access(learner_id,course_id)
values('93300000-0000-4000-8000-000000000003',933001);

set local role authenticated;
select lives_ok($$select public.remove_authoring_lesson(933026,933013)$$,'draft Lesson can be hard-deleted');
reset role;
select is((select count(*)::integer from public.lessons where id=933026),0,'draft Lesson row is gone');

set local role authenticated;
select lives_ok($$select public.remove_authoring_lesson(933022,933011)$$,'published Lesson can be removed');
reset role;
select is((select status::text from public.lessons where id=933022),'archived','published Lesson is archived in source hierarchy');
select is((select count(*)::integer from public.course_release_lessons where id=933072),1,'historical Release retains removed Lesson');
select is((select count(*)::integer from public.learner_release_lesson_progress where course_release_lesson_id=933072),1,'historical Lesson progress remains');

set local role authenticated;
select lives_ok($$select public.remove_authoring_unit(933012,933001)$$,'published Unit can be removed');
reset role;
select is((select status::text from public.units where id=933012),'archived','published Unit is archived');
select is((select status::text from public.lessons where id=933025),'archived','published Unit descendants are archived');
select is((select count(*)::integer from public.course_release_units where id=933062),1,'historical Release retains removed Unit');

select public.create_course_release_from_published(933001) as release_two_id \gset
select is((select release_number from public.course_releases where id=:release_two_id),2,'future source state creates Release 2');
select is((select count(*)::integer from public.course_release_lessons l join public.course_release_units u on u.id=l.course_release_unit_id where u.course_release_id=:release_two_id),3,'Release 2 contains only active Lessons A, C, and D');
select is((select count(*)::integer from public.course_release_lessons l join public.course_release_units u on u.id=l.course_release_unit_id where u.course_release_id=:release_two_id and l.source_lesson_id in (933022,933025)),0,'removed content is absent from Release 2');

insert into public.course_release_learner_entitlements(course_release_id,learner_id) values(:release_two_id,'93300000-0000-4000-8000-000000000003');
insert into public.learner_release_lesson_progress(learner_id,course_release_lesson_id,completed_at)
select '93300000-0000-4000-8000-000000000003',l.id,now() from public.course_release_lessons l join public.course_release_units u on u.id=l.course_release_unit_id
where u.course_release_id=:release_two_id and l.source_lesson_id in (933021,933023);
select ok(public.release_lesson_is_eligible('93300000-0000-4000-8000-000000000003',(select l.id from public.course_release_lessons l join public.course_release_units u on u.id=l.course_release_unit_id where u.course_release_id=:release_two_id and l.source_lesson_id=933024)),'removed intermediate content is not required for Release 2 eligibility');

set local role authenticated;
set local request.jwt.claim.sub='93300000-0000-4000-8000-000000000002';
select throws_ok($$select public.remove_authoring_lesson(933021,933011)$$,'Course owner or administrator permission is required','another Teacher cannot remove content');
set local request.jwt.claim.sub='93300000-0000-4000-8000-000000000003';
select throws_ok($$select public.remove_authoring_unit(933011,933001)$$,'Course owner or administrator permission is required','learner cannot remove content');
set local request.jwt.claim.sub='93300000-0000-4000-8000-000000000001';
select lives_ok($$select public.remove_authoring_course(933001)$$,'published Course can be retired');
reset role;
select is((select status::text from public.courses where id=933001),'archived','retired Course leaves active authoring');
select is((select learner_visibility::text from public.courses where id=933001),'class_only','retirement removes learner-library visibility');
select is((select count(*)::integer from public.course_unlisted_share_links where course_id=933001),0,'retirement revokes the unlisted link');
select is((select count(*)::integer from public.learner_independent_course_access where course_id=933001),0,'retirement revokes independent access grants');
select is((select count(*)::integer from public.course_releases where course_id=933001),2,'retirement preserves historical Releases');
select is((select count(*)::integer from public.learner_release_lesson_progress where course_release_lesson_id=933072),1,'retirement preserves historical progress');
select is((select status::text from public.class_course_assignments where id=933091),'active','existing active Assignment remains active');

grant execute on function public.can_access_course_release(bigint) to authenticated;
set local role authenticated;
set local request.jwt.claim.sub='93300000-0000-4000-8000-000000000003';
select ok(public.can_access_course_release(933051),'existing assigned Release remains accessible after retirement');
set local request.jwt.claim.sub='93300000-0000-4000-8000-000000000001';
select throws_ok(format('select public.assign_class_course_release(933081,%s)',:release_two_id),'Course Release is unavailable','retired Course cannot receive a new Assignment');
select throws_ok($$select public.set_course_learner_visibility(933001,'unlisted')$$,'Course visibility is unavailable for a retired Course','retired Course cannot restore sharing');

select * from finish();
rollback;
