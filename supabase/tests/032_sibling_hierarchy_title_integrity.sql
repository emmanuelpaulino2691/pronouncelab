begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;
select plan(23);

insert into auth.users (id) values ('93200000-0000-4000-8000-000000000001');
insert into public.user_roles (user_id, role)
values ('93200000-0000-4000-8000-000000000001', 'teacher');
set local request.jwt.claim.sub = '93200000-0000-4000-8000-000000000001';

insert into public.courses (id, slug, title, position, status, owner_user_id) values
  (932001, 'title-integrity-one', 'Title integrity one', 932001, 'draft', '93200000-0000-4000-8000-000000000001'),
  (932002, 'title-integrity-two', 'Title integrity two', 932002, 'draft', '93200000-0000-4000-8000-000000000001');
insert into public.units (id, course_id, title, position, status) values
  (932011, 932001, 'Unit 1', 0, 'draft'),
  (932012, 932001, 'Unit 2', 1, 'draft'),
  (932013, 932002, ' unit 1 ', 0, 'draft'),
  (932014, 932001, 'unit 1 (copy)', 2, 'draft');
insert into public.lessons (id, unit_id, title, position, status) values
  (932021, 932011, 'Lesson 1', 0, 'draft'),
  (932022, 932011, 'Lesson 2', 1, 'draft'),
  (932023, 932012, ' lesson 1 ', 0, 'draft'),
  (932024, 932013, 'LESSON 1', 0, 'draft'),
  (932025, 932011, 'lesson 1 (copy)', 2, 'draft');

select is((select count(*)::integer from pg_catalog.pg_indexes where schemaname = 'public' and indexname = 'units_course_normalized_title_unique'), 1,
  'Unit normalized-title uniqueness is installed');
select is((select count(*)::integer from pg_catalog.pg_indexes where schemaname = 'public' and indexname = 'lessons_unit_normalized_title_unique'), 1,
  'Lesson normalized-title uniqueness is installed');

select throws_ok(
  $$insert into public.units (course_id, title, position) values (932001, 'Unit 1', 4)$$,
  '23505', 'duplicate key value violates unique constraint "units_course_normalized_title_unique"',
  'an exact duplicate Unit title in one Course is rejected');
select throws_ok(
  $$insert into public.units (course_id, title, position) values (932001, 'UNIT 1', 4)$$,
  '23505', 'duplicate key value violates unique constraint "units_course_normalized_title_unique"',
  'a differently-cased duplicate Unit title in one Course is rejected');
select throws_ok(
  $$insert into public.units (course_id, title, position) values (932001, ' Unit 1 ', 4)$$,
  '23505', 'duplicate key value violates unique constraint "units_course_normalized_title_unique"',
  'a surrounding-whitespace duplicate Unit title in one Course is rejected');
select throws_ok(
  $$insert into public.units (course_id, title, position) values (932001, 'Unit   1', 4)$$,
  '23505', 'duplicate key value violates unique constraint "units_course_normalized_title_unique"',
  'an internal-whitespace duplicate Unit title in one Course is rejected');
select lives_ok(
  $$insert into public.units (course_id, title, position) values (932002, 'Unit 2', 1)$$,
  'another Course may use the same Unit title');
select throws_ok(
  $$update public.units set title = ' unit 1 ' where id = 932012$$,
  '23505', 'duplicate key value violates unique constraint "units_course_normalized_title_unique"',
  'a Unit cannot be renamed into a sibling collision');

set local role authenticated;
select throws_ok(
  $$select public.create_draft_unit(932001, 'UNIT  1', '')$$,
  '23505', 'duplicate key value violates unique constraint "units_course_normalized_title_unique"',
  'the controlled Unit creation RPC cannot bypass sibling uniqueness');
reset role;

select throws_ok(
  $$insert into public.lessons (unit_id, title, position) values (932011, 'Lesson 1', 4)$$,
  '23505', 'duplicate key value violates unique constraint "lessons_unit_normalized_title_unique"',
  'an exact duplicate Lesson title in one Unit is rejected');
select throws_ok(
  $$insert into public.lessons (unit_id, title, position) values (932011, 'LESSON 1', 4)$$,
  '23505', 'duplicate key value violates unique constraint "lessons_unit_normalized_title_unique"',
  'a differently-cased duplicate Lesson title in one Unit is rejected');
select throws_ok(
  $$insert into public.lessons (unit_id, title, position) values (932011, ' Lesson 1 ', 4)$$,
  '23505', 'duplicate key value violates unique constraint "lessons_unit_normalized_title_unique"',
  'a surrounding-whitespace duplicate Lesson title in one Unit is rejected');
select throws_ok(
  $$insert into public.lessons (unit_id, title, position) values (932011, 'Lesson   1', 4)$$,
  '23505', 'duplicate key value violates unique constraint "lessons_unit_normalized_title_unique"',
  'an internal-whitespace duplicate Lesson title in one Unit is rejected');
select lives_ok(
  $$insert into public.lessons (unit_id, title, position) values (932012, 'Lesson 2', 1)$$,
  'another Unit in the same Course may use the same Lesson title');
select lives_ok(
  $$insert into public.lessons (unit_id, title, position) values (932013, 'Lesson 2', 1)$$,
  'a Unit in another Course may use the same Lesson title');
select throws_ok(
  $$update public.lessons set title = ' lesson 1 ' where id = 932022$$,
  '23505', 'duplicate key value violates unique constraint "lessons_unit_normalized_title_unique"',
  'a Lesson cannot be renamed into a sibling collision');

set local role authenticated;
select throws_ok(
  $$select public.create_draft_lesson(932011, 'LESSON  1', '')$$,
  '23505', 'duplicate key value violates unique constraint "lessons_unit_normalized_title_unique"',
  'the controlled Lesson creation RPC cannot bypass sibling uniqueness');
create temporary table copied_unit as select copied.* from public.duplicate_draft_unit(932011, 932001) copied;
select is((select title from copied_unit), 'Unit 1 (Copy 2)',
  'Unit duplication chooses a normalized collision-free sibling title');
create temporary table copied_lesson as select copied.* from public.duplicate_draft_lesson(932021, 932011) copied;
select is((select title from copied_lesson), 'Lesson 1 (Copy 2)',
  'Lesson duplication chooses a normalized collision-free sibling title');
reset role;

select is((select count(*)::integer from public.units where course_id = 932001 and lower(regexp_replace(btrim(title), '[[:space:]]+', ' ', 'g')) = 'unit 1'), 1,
  'the Unit invariant retains one normalized sibling');
select is((select count(*)::integer from public.lessons where unit_id = 932011 and lower(regexp_replace(btrim(title), '[[:space:]]+', ' ', 'g')) = 'lesson 1'), 1,
  'the Lesson invariant retains one normalized sibling');
select is((select count(distinct lesson.unit_id)::integer from public.lessons lesson join public.units unit on unit.id = lesson.unit_id where unit.course_id in (932001, 932002) and lower(regexp_replace(btrim(lesson.title), '[[:space:]]+', ' ', 'g')) = 'lesson 1'), 4,
  'Lesson title reuse across Units is explicitly preserved');
select is((select count(*)::integer from public.lessons where unit_id = (select id from copied_unit) and title = 'Lesson 1'), 1,
  'duplicating a Unit preserves its Lesson titles in the new Unit');

select * from finish();
rollback;
