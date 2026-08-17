begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;
select plan(16);

insert into auth.users (id) values
  ('92700000-0000-4000-8000-000000000001'),
  ('92700000-0000-4000-8000-000000000002'),
  ('92700000-0000-4000-8000-000000000003');
insert into public.user_roles (user_id, role) values
  ('92700000-0000-4000-8000-000000000003', 'teacher');

reset role;
set local request.jwt.claim.sub = '92700000-0000-4000-8000-000000000003';
insert into public.courses (id, slug, title, position, status, owner_user_id, published_at)
values (927001, 'learner-progress', 'Learner Progress', 927001, 'published', '92700000-0000-4000-8000-000000000003', now());
update public.courses set learner_visibility='public' where id=927001;
insert into public.units (id, course_id, title, position, status, published_at)
values (927011, 927001, 'Published unit', 0, 'published', now());
insert into public.lessons (id, unit_id, title, position, status, published_at)
values (927021, 927011, 'Published lesson', 0, 'published', now());
insert into public.lesson_versions (id, lesson_id, version_number, status, created_by, published_at)
values (927031, 927021, 1, 'draft', '92700000-0000-4000-8000-000000000003', now());
insert into public.lesson_activities (id, lesson_version_id, type, title, position)
values (927041, 927031, 'theory', 'First', 0), (927042, 927031, 'theory', 'Second', 1);
select pg_catalog.set_config('pronouncelab.lesson_publication', 'on', true);
update public.lesson_versions set status = 'published' where id = 927031;
update public.lessons set current_published_version_id = 927031 where id = 927021;

insert into public.lessons (id, unit_id, title, position, status, published_at)
values (927023, 927011, 'Locked published lesson', 1, 'published', now());
insert into public.lesson_versions (id, lesson_id, version_number, status, created_by, published_at)
values (927033, 927023, 1, 'draft', '92700000-0000-4000-8000-000000000003', now());
insert into public.lesson_activities (id, lesson_version_id, type, title, position)
values (927044, 927033, 'theory', 'Locked activity', 0);
update public.lesson_versions set status = 'published' where id = 927033;
update public.lessons set current_published_version_id = 927033 where id = 927023;

set local role authenticated;
set local request.jwt.claim.sub = '92700000-0000-4000-8000-000000000001';
select ok(public.is_learner_identity(), 'ordinary authenticated user is a learner identity');
select lives_ok($$select public.record_learner_lesson_visit(927021, 927041)$$, 'learner records own lesson visit');
select lives_ok($$select public.record_learner_activity_completion(927041)$$, 'learner records own activity completion');
select throws_ok($$select public.record_learner_activity_completion(927044)$$, 'Complete the previous learning content first', 'direct completion cannot bypass sequential Lesson eligibility');
select lives_ok($$select public.record_learner_activity_completion(927041)$$, 'duplicate completion is idempotent');
select is((select count(*)::integer from public.learner_activity_progress), 1, 'duplicate completion creates one row');
select is((public.get_my_learner_progress() #>> '{lessons,0,lessonId}')::bigint, 927021::bigint, 'another device can read the server lesson snapshot');
select is((public.record_learner_activity_completion(927042)->>'lessonComplete')::boolean, true, 'last required activity completes the lesson');
select ok((public.get_my_learner_progress() #>> '{lessons,0,completedAt}') is not null, 'completed lesson remains reviewable in learner history');

set local request.jwt.claim.sub = '92700000-0000-4000-8000-000000000002';
select is((select count(*)::integer from public.learner_lesson_progress), 0, 'learner B cannot read learner A lesson progress');
select throws_ok(
  $$insert into public.learner_activity_progress (learner_id, activity_id) values ('92700000-0000-4000-8000-000000000001', 927041)$$,
  'permission denied for table learner_activity_progress',
  'learner B cannot directly mutate learner A progress');

set local request.jwt.claim.sub = '92700000-0000-4000-8000-000000000003';
select ok(not public.is_learner_identity(), 'teacher account is not implicitly a learner');
select throws_ok($$select public.record_learner_activity_completion(927041)$$, 'Learner authentication is required', 'teacher cannot create learner progress');
select is((select count(*)::integer from public.learner_lesson_progress), 0, 'teacher has no universal learner progress visibility');

reset role;
set local request.jwt.claim.sub = '';
set local role anon;
select throws_ok($$select public.get_my_learner_progress()$$, 'permission denied for function get_my_learner_progress', 'anonymous user cannot read authenticated progress');

reset role;
set local request.jwt.claim.sub = '92700000-0000-4000-8000-000000000003';
insert into public.lessons (id, unit_id, title, position, status) values (927022, 927011, 'Draft lesson', 2, 'draft');
insert into public.lesson_versions (id, lesson_id, version_number, status, created_by) values (927032, 927022, 1, 'draft', '92700000-0000-4000-8000-000000000003');
insert into public.lesson_activities (id, lesson_version_id, type, title, position) values (927043, 927032, 'theory', 'Draft', 0);
set local role authenticated;
set local request.jwt.claim.sub = '92700000-0000-4000-8000-000000000001';
select throws_ok($$select public.record_learner_activity_completion(927043)$$, 'Published learner activity is unavailable', 'draft activity cannot receive learner progress');

select * from finish();
rollback;
