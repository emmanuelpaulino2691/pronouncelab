begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_catalog;
select plan(6);

insert into auth.users (id)
values ('91300000-0000-4000-8000-000000000099');
insert into public.user_roles (user_id, role)
values (
  '91300000-0000-4000-8000-000000000099',
  'admin'
);
set local request.jwt.claim.sub =
  '91300000-0000-4000-8000-000000000099';

select ok(public.pronunciation_entries_are_valid('word_list', '["cat", "cake"]'::jsonb, true), 'word list entries are valid');
select ok(public.pronunciation_entries_are_valid('minimal_pairs', '[{"left":"cat","right":"cut"}]'::jsonb, true), 'minimal-pair entries are valid');
select isnt(public.pronunciation_entries_are_valid('minimal_pairs', '[{"left":"cat","right":""}]'::jsonb, true), true, 'incomplete pairs are invalid');
select isnt(public.pronunciation_entries_are_valid('word_list', '[]'::jsonb, true), true, 'empty word lists are invalid for publication');

insert into public.courses (id, slug, title, description, level, emoji, position, status)
values (913001, 'pronunciation-block-test', 'Pronunciation test', '', 'A1', '', 913001, 'draft');
insert into public.units (id, course_id, title, description, position, status)
values (913002, 913001, 'Unit', '', 0, 'draft');
insert into public.lessons (id, unit_id, title, description, position, status)
values (913003, 913002, 'Lesson', '', 0, 'draft');
insert into public.lesson_versions (id, lesson_id, version_number, status)
values (913004, 913003, 1, 'draft');
insert into public.lesson_activities (id, lesson_version_id, type, title, position, required)
values (913005, 913004, 'pronunciation', 'Pronunciation', 0, true);
insert into public.pronunciation_items (id, activity_id, title, display_text, block_type, entries, position)
values (913006, 913005, 'Words', '', 'word_list', '[]'::jsonb, 0);

select throws_ok(
  $test$select public.validate_lesson_version_pronunciation_blocks(913004)$test$,
  'Invalid publication content: pronunciation block 913006 requires valid entries',
  'publication rejects an empty pronunciation block'
);

update public.pronunciation_items set entries = '["cat"]'::jsonb where id = 913006;
select lives_ok(
  $test$select public.validate_lesson_version_pronunciation_blocks(913004)$test$,
  'publication accepts a complete pronunciation block'
);

select * from finish();
rollback;
