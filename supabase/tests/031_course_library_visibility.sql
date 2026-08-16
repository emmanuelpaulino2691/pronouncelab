begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions,pg_catalog;
select plan(22);

insert into auth.users(id,email) values
('93100000-0000-4000-8000-000000000001','teacher-a@visibility.test'),
('93100000-0000-4000-8000-000000000002','teacher-b@visibility.test'),
('93100000-0000-4000-8000-000000000003','learner@visibility.test');
insert into public.user_roles(user_id,role) values
('93100000-0000-4000-8000-000000000001','teacher'),('93100000-0000-4000-8000-000000000002','teacher');
set local request.jwt.claim.sub='93100000-0000-4000-8000-000000000001';
insert into public.courses(id,slug,title,position,status,published_at,owner_user_id) values
(931001,'class-only-visibility','Class only',931001,'published',now(),'93100000-0000-4000-8000-000000000001'),
(931002,'public-visibility','Public',931002,'published',now(),'93100000-0000-4000-8000-000000000001'),
(931003,'unlisted-visibility','Unlisted',931003,'published',now(),'93100000-0000-4000-8000-000000000001');
insert into public.units(id,course_id,title,position,status,published_at) values(931011,931001,'Class unit',0,'published',now()),(931012,931002,'Public unit',0,'published',now()),(931013,931003,'Unlisted unit',0,'published',now());
insert into public.lessons(id,unit_id,title,position,status,published_at) values(931021,931011,'Class lesson',0,'published',now()),(931022,931012,'Public lesson',0,'published',now()),(931023,931013,'Unlisted lesson',0,'published',now());
insert into public.lesson_versions(id,lesson_id,version_number,status,published_at,created_by) values(931031,931021,1,'draft',now(),'93100000-0000-4000-8000-000000000001'),(931032,931022,1,'draft',now(),'93100000-0000-4000-8000-000000000001'),(931033,931023,1,'draft',now(),'93100000-0000-4000-8000-000000000001');
insert into public.lesson_activities(id,lesson_version_id,type,title,position) values(931041,931031,'theory','Class activity',0),(931042,931032,'theory','Public activity',0),(931043,931033,'theory','Unlisted activity',0);
select pg_catalog.set_config('pronouncelab.lesson_publication','on',true);
update public.lesson_versions set status='published' where id between 931031 and 931033;
update public.lessons set current_published_version_id=case id when 931021 then 931031 when 931022 then 931032 else 931033 end where id between 931021 and 931023;

select is((select learner_visibility::text from public.courses where id=931001),'class_only','new Course default is Class only');
create temporary table release_count_before as select count(*)::integer value from public.course_releases where course_id=931001;
select lives_ok($$select public.set_course_learner_visibility(931002,'public')$$,'owner makes Course Public');
create temporary table unlisted_token as select public.set_course_learner_visibility(931003,'unlisted')->>'shareToken' token;
grant select on unlisted_token to authenticated;
select ok(length((select token from unlisted_token))=64,'Unlisted visibility creates a cryptographic token');
select is((select count(*)::integer from public.course_releases where course_id=931001),(select value from release_count_before),'visibility does not create a Release');

set local role anon;set local request.jwt.claim.sub='';
select is(jsonb_array_length(public.get_published_learning_catalog(1)->'courses'),1,'anonymous catalog lists only Public Course');
select ok(public.get_published_lesson(931022,1)->'lesson' is not null,'Public Lesson is readable');
select is(public.get_published_lesson(931021,1)->'lesson','null'::jsonb,'Class-only current Lesson is denied');
select is(public.get_published_lesson(931023,1)->'lesson','null'::jsonb,'Unlisted Lesson is denied before redemption');

reset role;set local role authenticated;set local request.jwt.claim.sub='93100000-0000-4000-8000-000000000003';
select throws_ok($$select public.redeem_unlisted_course_link('invalid')$$,'This shared Course link is invalid or no longer available','invalid Unlisted token fails');
select lives_ok(format('select public.redeem_unlisted_course_link(%L)',(select token from unlisted_token)),'valid Unlisted token redeems');
select ok(public.get_published_lesson(931023,1)->'lesson' is not null,'redeemed learner reads Unlisted Lesson');
select is(jsonb_array_length(public.get_published_learning_catalog(1)->'courses'),2,'accessible catalog carries Public and redeemed Unlisted contexts');
select throws_ok($$select public.set_course_learner_visibility(931001,'public')$$,'Course visibility is unavailable','learner cannot change visibility');
select throws_ok($$select public.record_learner_activity_completion(931041)$$,'Published learner activity is unavailable','Class-only current progress is denied');
select lives_ok($$select public.record_learner_activity_completion(931042)$$,'Public independent progress works');
select lives_ok($$select public.record_learner_activity_completion(931043)$$,'redeemed Unlisted independent progress works');

reset role;set local role authenticated;set local request.jwt.claim.sub='93100000-0000-4000-8000-000000000002';
select throws_ok($$select public.set_course_learner_visibility(931001,'public')$$,'Course visibility is unavailable','Teacher B cannot change Teacher A visibility');

set local request.jwt.claim.sub='93100000-0000-4000-8000-000000000001';
select lives_ok($$select public.regenerate_course_unlisted_share_link(931003)$$,'owner regenerates Unlisted link');
set local request.jwt.claim.sub='93100000-0000-4000-8000-000000000003';
select throws_ok(format('select public.redeem_unlisted_course_link(%L)',(select token from unlisted_token)),'This shared Course link is invalid or no longer available','regeneration revokes old link');

reset role;set local request.jwt.claim.sub='93100000-0000-4000-8000-000000000001';
select lives_ok($$select public.set_course_learner_visibility(931003,'class_only')$$,'owner returns Unlisted Course to Class only');
set local role authenticated;set local request.jwt.claim.sub='93100000-0000-4000-8000-000000000003';
select is(public.get_published_lesson(931023,1)->'lesson','null'::jsonb,'visibility change revokes redeemed current access');
select is((select count(*)::integer from public.learner_activity_progress where learner_id='93100000-0000-4000-8000-000000000003'),2,'visibility revocation preserves independent progress rows');

select * from finish();
rollback;
