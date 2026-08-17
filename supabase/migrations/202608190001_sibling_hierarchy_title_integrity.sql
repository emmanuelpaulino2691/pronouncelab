begin;

-- Authoring names are unique within the collection in which Teachers see them.
-- Normalization trims the title, collapses every run of whitespace, and folds case.
do $$
declare
  conflicts text;
begin
  select pg_catalog.string_agg(
    pg_catalog.format('course_id=%s normalized_title=%L ids=%s', course_id, normalized_title, ids),
    '; ' order by course_id, normalized_title
  ) into conflicts
  from (
    select course_id,
      pg_catalog.lower(pg_catalog.regexp_replace(pg_catalog.btrim(title), '[[:space:]]+', ' ', 'g')) as normalized_title,
      pg_catalog.array_agg(id order by id) as ids
    from public.units
    group by course_id,
      pg_catalog.lower(pg_catalog.regexp_replace(pg_catalog.btrim(title), '[[:space:]]+', ' ', 'g'))
    having pg_catalog.count(*) > 1
  ) duplicates;
  if conflicts is not null then
    raise exception 'Sibling Unit title conflicts block migration: %', conflicts;
  end if;

  select pg_catalog.string_agg(
    pg_catalog.format('unit_id=%s normalized_title=%L ids=%s', unit_id, normalized_title, ids),
    '; ' order by unit_id, normalized_title
  ) into conflicts
  from (
    select unit_id,
      pg_catalog.lower(pg_catalog.regexp_replace(pg_catalog.btrim(title), '[[:space:]]+', ' ', 'g')) as normalized_title,
      pg_catalog.array_agg(id order by id) as ids
    from public.lessons
    group by unit_id,
      pg_catalog.lower(pg_catalog.regexp_replace(pg_catalog.btrim(title), '[[:space:]]+', ' ', 'g'))
    having pg_catalog.count(*) > 1
  ) duplicates;
  if conflicts is not null then
    raise exception 'Sibling Lesson title conflicts block migration: %', conflicts;
  end if;
end;
$$;

create unique index units_course_normalized_title_unique
on public.units (
  course_id,
  pg_catalog.lower(pg_catalog.regexp_replace(pg_catalog.btrim(title), '[[:space:]]+', ' ', 'g'))
);

create unique index lessons_unit_normalized_title_unique
on public.lessons (
  unit_id,
  pg_catalog.lower(pg_catalog.regexp_replace(pg_catalog.btrim(title), '[[:space:]]+', ' ', 'g'))
);

-- Copy naming must use the same comparison as the authoritative indexes so a
-- differently-cased historical copy name cannot turn a safe duplicate into an error.
create or replace function public.next_copy_title(
  source_title text,
  entity_table regclass,
  parent_column text default null,
  parent_id bigint default null
)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare candidate text; base_title text; copy_number integer := 1; exists_already boolean;
begin
  base_title := pg_catalog.regexp_replace(source_title, ' \(Copy( [0-9]+)?\)$', '');
  loop
    candidate := base_title || case when copy_number = 1 then ' (Copy)' else ' (Copy ' || copy_number || ')' end;
    if parent_column is null then
      execute pg_catalog.format(
        'select exists(select 1 from %s where pg_catalog.lower(pg_catalog.regexp_replace(pg_catalog.btrim(title), ''[[:space:]]+'', '' '', ''g'')) = pg_catalog.lower(pg_catalog.regexp_replace(pg_catalog.btrim($1), ''[[:space:]]+'', '' '', ''g'')))',
        entity_table
      ) into exists_already using candidate;
    else
      execute pg_catalog.format(
        'select exists(select 1 from %s where %I = $1 and pg_catalog.lower(pg_catalog.regexp_replace(pg_catalog.btrim(title), ''[[:space:]]+'', '' '', ''g'')) = pg_catalog.lower(pg_catalog.regexp_replace(pg_catalog.btrim($2), ''[[:space:]]+'', '' '', ''g'')))',
        entity_table, parent_column
      ) into exists_already using parent_id, candidate;
    end if;
    if not exists_already then return candidate; end if;
    copy_number := copy_number + 1;
  end loop;
end;
$$;

revoke all on function public.next_copy_title(text, regclass, text, bigint) from public, anon, authenticated;

commit;
