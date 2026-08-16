begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;
select plan(30);

insert into auth.users (id) values
  ('92400000-0000-4000-8000-000000000001'),
  ('92400000-0000-4000-8000-000000000002'),
  ('92400000-0000-4000-8000-000000000003');
insert into public.user_roles (user_id, role) values
  ('92400000-0000-4000-8000-000000000001', 'teacher'),
  ('92400000-0000-4000-8000-000000000002', 'teacher'),
  ('92400000-0000-4000-8000-000000000003', 'admin');

set local request.jwt.claim.sub = '92400000-0000-4000-8000-000000000001';
insert into public.courses (
  id, slug, title, position, status, owner_user_id
) values (
  924001, 'progressive-course', 'Progressive course', 924001, 'draft',
  '92400000-0000-4000-8000-000000000001'
);
insert into public.units (id, course_id, title, position, status)
values (924011, 924001, 'Published unit', 0, 'draft');
insert into public.lessons (id, unit_id, title, position, status)
values (924021, 924011, 'Published lesson', 0, 'draft');
insert into public.lesson_versions (
  id, lesson_id, version_number, status, created_by
) values (
  924031, 924021, 1, 'draft',
  '92400000-0000-4000-8000-000000000001'
);
insert into public.lesson_activities (
  id, lesson_version_id, type, title, position, required
) values (924041, 924031, 'theory', 'Learn', 0, true);
insert into public.theory_blocks (
  id, activity_id, block_type, position, text
) values (924051, 924041, 'paragraph', 0, 'Published content');

set local role authenticated;
select lives_ok($$select public.publish_lesson_version(924031)$$,
  'initial lesson publishes');
select is((public.publish_course(924001)->>'ok')::boolean, true,
  'initial course publication succeeds');
reset role; update public.courses set learner_visibility='public' where id=924001; set local role authenticated;

create temporary table new_unit as
select created.*
from public.create_draft_unit(
  924001, 'Draft unit', 'Future learner content'
) as created;
select is((select status::text from new_unit), 'draft',
  'teacher creates a draft unit below a published course');
select is((select status::text from public.courses where id = 924001), 'published',
  'course remains published while its draft grows');
select is((select status::text from public.units where id = 924011), 'published',
  'existing published unit remains unchanged');
select results_eq('select position from new_unit', array[1]::integer[],
  'new unit appends after the published sibling');
select results_eq(
  $$update public.units set title = 'Edited draft unit'
    where id = (select new_unit.id from new_unit) returning id$$,
  array[(select new_unit.id from new_unit)]::bigint[], 'new draft unit is editable');
select throws_ok(
  $$update public.units set title = 'Unsafe published edit'
    where id = 924011 returning id$$,
  'Published or retired units records are immutable',
  'published unit is not directly editable');
select ok(not (public.get_published_learning_catalog(1)::text like '%Edited draft unit%'),
  'draft unit is learner-invisible');

create temporary table new_lesson as
select created.*
from public.create_draft_lesson(924011, 'Draft lesson', 'Future lesson') as created;
select is((select status::text from new_lesson), 'draft',
  'teacher creates a draft lesson below a published unit');
select is((select status::text from public.units where id = 924011), 'published',
  'published unit remains published');
select is((select status::text from public.lessons where id = 924021), 'published',
  'existing published lesson remains unchanged');
select results_eq('select position from new_lesson', array[1]::integer[],
  'new lesson appends after the published sibling');
select is((select count(*)::integer from public.lesson_versions
  where lesson_id = (select new_lesson.id from new_lesson)
    and version_number = 1 and status = 'draft'), 1,
  'new lesson atomically receives draft Version 1');
select ok(public.get_published_lesson((select new_lesson.id from new_lesson), 1)::text
  not like '%Draft lesson%',
  'direct learner lesson lookup hides the draft');
select results_eq(
  $$update public.lessons set title = 'Edited draft lesson'
    where id = (select new_lesson.id from new_lesson) returning id$$,
  array[(select new_lesson.id from new_lesson)]::bigint[], 'new draft lesson is editable');
select throws_ok(
  $$update public.lessons set title = 'Unsafe published edit'
    where id = 924021 returning id$$,
  'Published or retired lessons records are immutable',
  'published lesson still requires a new version');

set local request.jwt.claim.sub = '92400000-0000-4000-8000-000000000002';
select throws_ok(
  $$select public.create_draft_unit(924001, 'Foreign unit', '')$$,
  'Course owner or administrator permission is required',
  'another teacher cannot add a unit');
select throws_ok(
  $$select public.create_draft_lesson(924011, 'Foreign lesson', '')$$,
  'Course owner or administrator permission is required',
  'another teacher cannot add a lesson');
select results_eq(
  $$update public.units set title = 'Foreign edit'
    where id = (select new_unit.id from new_unit) returning id$$,
  array[]::bigint[], 'another teacher cannot edit the owner draft');

set local request.jwt.claim.sub = '92400000-0000-4000-8000-000000000003';
create temporary table admin_unit as
select created.*
from public.create_draft_unit(924001, 'Admin draft', '') as created;
select is((select status::text from admin_unit), 'draft',
  'administrator retains progressive authoring authority');
select throws_ok(
  $$update public.units set title = 'Admin unsafe edit'
    where id = 924011 returning id$$,
  'Published or retired units records are immutable',
  'administrator ordinary writes cannot mutate published units');
select is(public.delete_draft_unit((select admin_unit.id from admin_unit), 924001),
  (select admin_unit.id from admin_unit), 'administrator can delete the new draft safely');

set local request.jwt.claim.sub = '92400000-0000-4000-8000-000000000001';
create temporary table deletable_lesson as
select created.*
from public.create_draft_lesson(924011, 'Discard me', '') as created;
select is(public.delete_draft_lesson((select deletable_lesson.id from deletable_lesson), 924011),
  (select deletable_lesson.id from deletable_lesson), 'owner can delete a new draft lesson below a published unit');

create temporary table unit_lesson as
select created.*
from public.create_draft_lesson(
  (select new_unit.id from new_unit), 'Unit lesson', ''
) as created;
select public.create_draft_lesson_activity(
  (select id from public.lesson_versions where lesson_id = (select new_lesson.id from new_lesson)),
  'theory', 'New lesson content');
select public.create_draft_lesson_activity(
  (select id from public.lesson_versions where lesson_id = (select unit_lesson.id from unit_lesson)),
  'theory', 'New unit content');
update public.theory_blocks block
set text = 'Ready content'
from public.lesson_activities activity
join public.lesson_versions version on version.id = activity.lesson_version_id
where block.activity_id = activity.id
  and version.lesson_id in (
    (select new_lesson.id from new_lesson),
    (select unit_lesson.id from unit_lesson)
  );

select is((public.publish_course(924001)->>'ok')::boolean, true,
  'course Publish updates releases ready new units and lessons');
select is((select status::text from public.units where id = (select new_unit.id from new_unit)),
  'published', 'new unit becomes published');
select is((select status::text from public.lessons where id = (select new_lesson.id from new_lesson)),
  'published', 'new lesson below existing unit becomes published');
select ok(public.get_published_learning_catalog(1)::text like '%Edited draft unit%'
  and public.get_published_learning_catalog(1)::text like '%Edited draft lesson%',
  'released additions become learner-visible');
select is((public.publish_course(924001)->>'ok')::boolean, true,
  'repeated publication with no changes is idempotent');
select is((select title from public.units where id = 924011), 'Published unit',
  'progressive publication never rewrites the published sibling');

select * from finish();
rollback;
