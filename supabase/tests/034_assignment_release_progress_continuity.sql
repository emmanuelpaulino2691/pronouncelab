begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions,pg_catalog;
select plan(13);

insert into auth.users(id,email) values
('93400000-0000-4000-8000-000000000001','teacher@continuity.test'),
('93400000-0000-4000-8000-000000000002','learner@continuity.test');
insert into public.user_roles(user_id,role) values('93400000-0000-4000-8000-000000000001','teacher');
set local request.jwt.claim.sub='93400000-0000-4000-8000-000000000001';
insert into public.courses(id,slug,title,position,status,owner_user_id) values(934001,'continuity','Continuity',934001,'draft','93400000-0000-4000-8000-000000000001');
insert into public.units(id,course_id,title,position,status) values(934011,934001,'Original Unit',0,'draft'),(934012,934001,'Added Unit',1,'draft');
insert into public.lessons(id,unit_id,title,position,status) values
(934021,934011,'Lesson A',0,'draft'),(934022,934011,'Lesson B',1,'draft'),
(934023,934012,'Lesson C',0,'draft'),(934024,934012,'Lesson D',1,'draft');
insert into public.lesson_versions(id,lesson_id,version_number,status,created_by) values
(934031,934021,1,'draft','93400000-0000-4000-8000-000000000001'),
(934032,934022,1,'draft','93400000-0000-4000-8000-000000000001'),
(934033,934022,2,'draft','93400000-0000-4000-8000-000000000001'),
(934034,934023,1,'draft','93400000-0000-4000-8000-000000000001'),
(934035,934024,1,'draft','93400000-0000-4000-8000-000000000001');
insert into public.course_releases(id,course_id,owner_user_id,release_number,course_slug,course_title,course_description,course_level,course_emoji,content_fingerprint) values
(934051,934001,'93400000-0000-4000-8000-000000000001',1,'continuity','Continuity','','A1','',repeat('a',64)),
(934052,934001,'93400000-0000-4000-8000-000000000001',2,'continuity','Continuity renamed','','A1','',repeat('b',64));
insert into public.course_release_units(id,course_release_id,source_unit_id,position,title,description) values
(934061,934051,934011,0,'Original Unit',''),(934062,934052,934011,0,'Renamed Unit',''),(934063,934052,934012,1,'Added Unit','');
insert into public.course_release_lessons(id,course_release_unit_id,source_lesson_id,lesson_version_id,position,title,description) values
(934071,934061,934021,934031,0,'Lesson A',''),(934072,934061,934022,934032,1,'Lesson B',''),
(934073,934062,934022,934033,0,'Lesson B renamed',''),(934074,934062,934021,934031,1,'Lesson A renamed',''),
(934075,934063,934023,934034,0,'Lesson C',''),(934076,934063,934024,934035,1,'Lesson D','');
insert into public.classes(id,owner_user_id,name,join_code) values(934081,'93400000-0000-4000-8000-000000000001','Continuity Class','9340AAAABBBBCCCC');
insert into public.class_enrollments(class_id,learner_user_id) values(934081,'93400000-0000-4000-8000-000000000002');
insert into public.class_course_assignments(id,class_id,course_release_id,source_course_id,assigned_by) values(934091,934081,934051,934001,'93400000-0000-4000-8000-000000000001');
insert into public.learner_release_lesson_progress(learner_id,course_release_lesson_id,started_at,completed_at,last_accessed_at) values
('93400000-0000-4000-8000-000000000002',934071,now()-interval '2 days',now()-interval '2 days',now()-interval '2 days'),
('93400000-0000-4000-8000-000000000002',934072,now()-interval '1 day',now()-interval '1 day',now()-interval '1 day');

set local role authenticated;
select lives_ok($$select public.assign_class_course_release(934081,934052)$$,'assignment update projects progress atomically');
reset role;
select is((select count(*)::integer from public.learner_release_lesson_progress where learner_id='93400000-0000-4000-8000-000000000002' and course_release_lesson_id in (934071,934072)),2,'Release 1 progress remains intact');
select is((select count(*)::integer from public.learner_release_lesson_progress where learner_id='93400000-0000-4000-8000-000000000002' and course_release_lesson_id in (934073,934074) and completed_at is not null),2,'stable source Lessons are completed in Release 2');
select ok(exists(select 1 from public.learner_release_lesson_progress where course_release_lesson_id=934073 and completed_at is not null),'changed Lesson version preserves Lesson completion');
select ok(exists(select 1 from public.learner_release_lesson_progress where course_release_lesson_id=934074 and completed_at is not null),'rename and reorder preserve Lesson completion');
select is((select count(*)::integer from public.learner_release_lesson_progress where course_release_lesson_id in (934075,934076)),0,'new Lessons begin incomplete');
select ok(public.release_lesson_is_eligible('93400000-0000-4000-8000-000000000002',934075),'first new Lesson is immediately eligible');
select ok(not public.release_lesson_is_eligible('93400000-0000-4000-8000-000000000002',934076),'later new Lesson remains sequentially locked');
select is((select count(*)::integer from public.class_course_assignments where class_id=934081 and status='active'),1,'replacement leaves one active assignment');
select is((select count(*)::integer from public.class_course_assignments where id=934091 and status='inactive'),1,'historical assignment row remains');
set local role authenticated;
select is((public.get_class_assignment_progress((select id from public.class_course_assignments where class_id=934081 and status='active'))#>>'{learners,0,completedLessons}')::integer,2,'Teacher report immediately shows two completed Lessons');
select is((public.get_class_assignment_progress((select id from public.class_course_assignments where class_id=934081 and status='active'))#>>'{learners,0,completionPercent}')::integer,50,'Teacher report changes from 100 percent to 50 percent');
select is(public.assign_class_course_release(934081,934052),public.assign_class_course_release(934081,934052),'repeat assignment update is idempotent');
select * from finish();
rollback;
