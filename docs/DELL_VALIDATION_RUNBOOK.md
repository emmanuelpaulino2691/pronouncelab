# Dell Local Supabase Validation Runbook

## First-pass result and required second pass

The first Dell pass successfully reset the disposable database through all 24
migrations ending at `202607240002`. The migration ledger was complete, but
the pgTAP run found three failure classes:

- `enforce_content_ownership()` accessed the course-only
  `NEW.owner_user_id` field while firing for child-table updates;
- the installed pgTAP version did not expose `not_ok(boolean, text)`;
- `publish_course` was safely configured with an empty search path, but test
  `017` expected `search_path=` instead of PostgreSQL's catalog value
  `search_path=""`.

The corrective plan adds forward migration
`202608060001_fix_content_ownership_trigger.sql`, replaces the unsupported
assertions without weakening them, corrects the catalog assertion, and adds
focused ownership-trigger regression coverage. Remote deployment remains
blocked until the second pass resets from zero through all 25 migrations and
every SQL test through `018` passes.

## Purpose and safety boundary

Use the Dell only to execute PronounceLab's complete migration chain and SQL tests against a disposable local Supabase database. Prepare and review code and documentation on the Lenovo.

This first Dell pass must not:

- run `supabase db push` (including `--dry-run` against the linked project);
- run migration repair or change the remote migration ledger;
- execute manual SQL against the linked/remote database;
- deploy to production;
- force-push, commit, merge, or rewrite Git history;
- edit any migration on the Dell;
- use a production or linked database URL for `psql`;
- copy data from the remote database into the disposable database.

Stop immediately if a command identifies a remote host/project, if the branch or commit differs from the expected handoff, if the worktree is not clean, or if a migration/test fails. Capture the failure before doing anything else.

## Expected handoff

- Branch: `sprint-40-41-teacher-publishing`
- Baseline commit before this corrective work: `7e30c31`
- Remote/local ledger before the Dell pass: equal through `202607220007`
- Local-only migrations, in dependency order:
  1. `202607220008_interactive_practice_foundation.sql`
  2. `202607230001_add_teacher_role.sql`
  3. `202607230002_teacher_ownership_foundation.sql`
  4. `202607230003_publishing_version_workflow.sql`
  5. `202607230004_publication_version_activation.sql`
  6. `202607240001_draft_version_mutation_hardening.sql`
  7. `202607240002_publish_course_workflow.sql`
  8. `202608060001_fix_content_ownership_trigger.sql`

The corrective migration, SQL tests, and documentation are currently
uncommitted on the Lenovo. The Dell cannot pull uncommitted files. Before using
this runbook, replace `<HANDOFF_COMMIT>` below with the exact authorized commit
that contains the reviewed corrective work.

## Prerequisites

- Windows PowerShell.
- Git.
- Node.js/npm only if `npx.cmd supabase` is not already cached/available.
- Docker Desktop with Linux containers and enough free disk space.
- Supabase CLI available through `npx.cmd supabase`.
- A fresh clone or clean worktree dedicated to validation.
- No `SUPABASE_DB_URL`, production database URL, or service-role credential in the shell.

The repository's `supabase/config.toml` uses local PostgreSQL port `54322`, database major version 17, migrations enabled, and `supabase/seed.sql` after migrations.

## Failure capture setup

Run from the repository root. Logs stay untracked under `.dell-validation`; do not add them to Git.

```powershell
$ValidationRoot = (Resolve-Path .).Path
$ValidationLogs = Join-Path $ValidationRoot ".dell-validation"
New-Item -ItemType Directory -Force -Path $ValidationLogs | Out-Null
Start-Transcript -Path (Join-Path $ValidationLogs "full-transcript.txt") -Force
```

If any step fails, record `$LASTEXITCODE`, do not continue, run the diagnostic commands in that step, then `Stop-Transcript`.

## Minimum Dell sequence

### 1. Synchronize the exact handoff

In an existing clean clone:

```powershell
git status --short --branch
git fetch origin sprint-40-41-teacher-publishing
git switch sprint-40-41-teacher-publishing
git pull --ff-only origin sprint-40-41-teacher-publishing
git rev-parse HEAD
git status --short --branch
```

Expected: `HEAD` equals `<HANDOFF_COMMIT>`, the branch tracks `origin/sprint-40-41-teacher-publishing`, and `git status --short` has no file entries.

Stop if the worktree is dirty, pull is not fast-forward, the branch differs, or `HEAD` differs. Never reset or discard Dell changes; preserve and resolve them separately.

### 2. Confirm tool availability

```powershell
docker version 2>&1 | Tee-Object (Join-Path $ValidationLogs "docker-version.txt")
npx.cmd supabase --version 2>&1 | Tee-Object (Join-Path $ValidationLogs "supabase-version.txt")
```

If the repository's locked JavaScript dependencies are absent and `npx` requires them, run only:

```powershell
npm.cmd ci 2>&1 | Tee-Object (Join-Path $ValidationLogs "npm-ci.txt")
```

`npm ci` is not required for SQL validation when the Supabase CLI is already available. Stop if Docker is not using the expected local engine or tool installation fails.

### 3. Start Docker Desktop and local Supabase

Start Docker Desktop manually. Wait until its engine reports healthy, then run:

```powershell
docker version 2>&1 | Tee-Object (Join-Path $ValidationLogs "docker-ready.txt")
npx.cmd supabase start 2>&1 | Tee-Object (Join-Path $ValidationLogs "supabase-start.txt")
if ($LASTEXITCODE -ne 0) { throw "supabase start failed" }
npx.cmd supabase status 2>&1 | Tee-Object (Join-Path $ValidationLogs "supabase-status-before-reset.txt")
```

Expected: local services are healthy and PostgreSQL is on `127.0.0.1:54322`. Stop if the output names a remote host, a port collision cannot be resolved safely, or a container is unhealthy.

### 4. Reset only the disposable local database

```powershell
npx.cmd supabase db reset --local 2>&1 | Tee-Object (Join-Path $ValidationLogs "db-reset.txt")
if ($LASTEXITCODE -ne 0) { throw "local db reset failed" }
```

Expected: every migration from `202607170001` through `202608060001` executes in filename order, then the local seed completes. This command is destructive only to the local disposable database.

Stop on the first SQL error. Save `db-reset.txt`, run `npx.cmd supabase status`, and do not edit or skip the failing migration on the Dell.

### 5. Run the full SQL/pgTAP suite

```powershell
npx.cmd supabase test db 2>&1 | Tee-Object (Join-Path $ValidationLogs "db-tests.txt")
if ($LASTEXITCODE -ne 0) { throw "SQL tests failed" }
```

Expected: files `010` through `018` run in lexical order, each plan completes, and there are no failed assertions or plan mismatches. Stop on any failure; do not weaken a test or alter fixtures on the Dell.

### 6. Inspect local migration and RPC state

All inspection uses the local database explicitly. Do not substitute a linked or remote URL.

```powershell
npx.cmd supabase migration list --local 2>&1 | Tee-Object (Join-Path $ValidationLogs "migration-list-local.txt")
$LocalDb = "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
$InspectionSql = @'
select version from supabase_migrations.schema_migrations order by version;
select n.nspname as schema_name,
       p.proname,
       pg_catalog.pg_get_function_identity_arguments(p.oid) as arguments,
       pg_catalog.pg_get_function_result(p.oid) as result,
       p.prosecdef as security_definer,
       p.proconfig,
       pg_catalog.has_function_privilege('anon', p.oid, 'EXECUTE') as anon_execute,
       pg_catalog.has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_execute
from pg_catalog.pg_proc p
join pg_catalog.pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'is_platform_admin', 'can_view_all_courses', 'can_manage_content',
    'can_edit_lesson_version', 'publish_lesson_version', 'publish_course',
    'create_draft_interactive_practice', 'duplicate_draft_course',
    'duplicate_draft_unit', 'duplicate_draft_lesson'
  )
order by p.proname, arguments;
select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
  and table_name in (
    'interactive_practice_exercises', 'questions', 'question_options'
  )
order by table_name, grantee, privilege_type;
'@
$InspectionSql | psql $LocalDb -X -v ON_ERROR_STOP=1 2>&1 | Tee-Object (Join-Path $ValidationLogs "readiness-inspection.txt")
if ($LASTEXITCODE -ne 0) { throw "local readiness inspection failed" }
```

Expected migration state: all seven formerly pending versions appear locally applied. Expected RPC/security state is listed below.

### 7. Stop local services

```powershell
npx.cmd supabase stop 2>&1 | Tee-Object (Join-Path $ValidationLogs "supabase-stop.txt")
if ($LASTEXITCODE -ne 0) { throw "supabase stop failed" }
npx.cmd supabase status 2>&1 | Tee-Object (Join-Path $ValidationLogs "supabase-status-after-stop.txt")
Stop-Transcript
```

After Supabase stops, exit Docker Desktop manually if it is not needed by another project. Do not use volume-deleting flags on the first pass; retain the disposable state until logs are reviewed.

## Complete migration chain

The exact repository order is:

1. `202607170001_content_schema.sql`
2. `202607170002_content_rls.sql`
3. `202607170003_content_storage.sql`
4. `202607170004_harden_content_security.sql`
5. `202607170005_close_immutability_gaps.sql`
6. `202607170006_enforce_draft_parent_inserts.sql`
7. `202607170007_lesson_authoring_rpcs.sql`
8. `202607170008_ai_speaking_missions.sql`
9. `202607170009_ai_speaking_mission_hardening.sql`
10. `202607170010_published_learner_delivery.sql`
11. `202607220001_controlled_content_deletes.sql`
12. `202607220002_delete_content_leaf_first.sql`
13. `202607220003_ai_mission_spanish_instructions.sql`
14. `202607220004_require_listening_audio_for_publication.sql`
15. `202607220005_pronunciation_block_foundation.sql`
16. `202607220006_publish_pronunciation_blocks.sql`
17. `202607220007_controlled_hierarchy_duplication.sql`
18. `202607220008_interactive_practice_foundation.sql`
19. `202607230001_add_teacher_role.sql`
20. `202607230002_teacher_ownership_foundation.sql`
21. `202607230003_publishing_version_workflow.sql`
22. `202607230004_publication_version_activation.sql`
23. `202607240001_draft_version_mutation_hardening.sql`
24. `202607240002_publish_course_workflow.sql`
25. `202608060001_fix_content_ownership_trigger.sql`

### `202608060001` — ownership-trigger row-type correction

- Purpose: makes the shared ownership trigger safe on all 13 trigger targets.
- Creates/changes: replaces only `enforce_content_ownership()` and reasserts
  that API roles cannot execute the trigger function directly.
- Security: SECURITY DEFINER with `search_path = ''`; no dynamic SQL; course
  ownership remains immutable; descendants still resolve the authoritative
  course before authorization.
- Data risk: no table or data rewrite. The behavioral change removes invalid
  child-row field dereferencing while retaining owner, publisher lifecycle,
  and administrator checks.
- Disposable execution: required in the second Dell reset before any remote
  deployment decision.

## Pending migration audit

### `202607220008` — Interactive Practice foundation

- Purpose: adds staff-only Interactive Practice authoring while deliberately blocking learner publication.
- Creates/changes: enum value `lesson_activity_type.interactive_practice`; table and identity sequence `interactive_practice_exercises`; RLS; staff SELECT policy; completeness and publication validators; create/save/duplicate RPCs; replacement `publish_lesson_version(bigint)`.
- Dependencies: all migrations through `202607220007`, especially activity enum/table, hierarchy gate, draft helpers, validation functions, publication RPC, and duplication infrastructure.
- Security: table SELECT and sequence usage/select go to `authenticated`; RLS calls `can_manage_content()`. Mutation is RPC-only because no table INSERT/UPDATE/DELETE grant is added. All security-definer functions set `search_path = ''`; internal validators revoke API execution; authoring/publication RPCs grant only `authenticated` after revoking default/public access.
- Later replacements: `publish_lesson_version` is replaced by `202607230002` and again by `202607230004`; parent draft-status assumptions inside Interactive Practice mutations are rewritten by `202607240001`; its table enters ownership RLS/triggers in `202607230002`.
- Data risk: enum addition is safe; the new table is empty. The publication replacement intentionally rejects every version containing Interactive Practice even when complete. Existing content is unaffected unless it uses the newly added enum after this migration.
- Disposable execution: safe and required.
- History: introduced by commit `c7ab199`; no repository evidence of a later edit before the current audit.

### `202607230001` — teacher role enum

- Purpose: makes `teacher` a first-class `admin_role` value in a transaction separate from its first use.
- Creates/changes: one enum value only.
- Dependencies: `admin_role` from `202607170001`.
- Later use: immediately required by `202607230002`; no later replacement.
- Data risk: additive. PostgreSQL enum ordering must not be used for authorization; the repository compares explicit values. Splitting the enum commit prevents unsafe same-transaction use.
- Disposable execution: safe and required.
- History: introduced with the Sprint 40–41 migration commit; no separate later edit is visible.

### `202607230002` — teacher ownership foundation

- Purpose: establishes immutable course-root ownership and owner-derived authorization.
- Creates/changes: `courses.owner_user_id` FK/default/not-null; replaces global course position uniqueness with `(owner_user_id, position)`; owner index; ownership helpers; `enforce_content_ownership` trigger on 13 content tables; replaces all hierarchy/subtype RLS policies; wraps `duplicate_draft_course`; replaces `publish_lesson_version`.
- Dependencies: `teacher` enum from `202607230001`; Interactive Practice table from `202607220008`; all prior content tables, role helpers, hierarchy helpers, duplication RPC, and publication validators.
- Grants: public/anon are revoked from new helpers; authenticated receives only UI-facing/helper RPCs. `content_row_course_id` and the trigger remain non-executable by API roles. No new anon content mutation grant is introduced.
- Data risk: highest of the seven. It backfills ownership from an editor/admin `created_by`, otherwise the earliest admin. It aborts if any course remains ownerless. It drops `courses_position_unique`; duplicate positions are allowed across owners but not within one owner. Existing duplicate positions that collapse to the same fallback owner would make the new unique constraint fail. The trigger set changes every security-definer mutation's effective authorization.
- Later replacements: `publish_lesson_version` is replaced by `202607230004`; the renamed pre-ownership course duplicator remains as an internal function. `can_edit_lesson_version` in `202607240001` builds on its owner helper.
- Disposable execution: safe and essential, but local seed data must contain an admin whenever seeded courses lack eligible creators.
- History: introduced in commit `7489c7f` while unapplied according to the verified ledger.

### `202607230003` — draft version creation

- Purpose: creates a new draft version from the current/latest published version and deep-copies its activity tree.
- Creates/changes: `create_lesson_draft_version(bigint,bigint)` only.
- Dependencies: ownership-aware `can_edit_drafts`, hierarchy gate, every subtype table including Interactive Practice, and pronunciation columns added by `202607220005`.
- Security: SECURITY DEFINER, empty search path, PUBLIC/anon revoked, authenticated granted.
- Data risk: idempotently returns an existing latest draft; otherwise increments `version_number` and copies media references rather than bytes. It assumes subtype positions identify related copied listening rows; malformed or duplicate source data may fail constraints. Ownership is enforced indirectly by the trigger introduced in `202607230002`.
- Later replacements: none.
- Disposable execution: safe; test with every subtype and published source history.

### `202607230004` — publication version activation

- Purpose: makes lesson publication archive the previous version, activate the new pointer, and publish ancestor metadata.
- Creates/changes: replaces `protect_publishable_content()` and `publish_lesson_version(bigint)`.
- Dependencies: ownership publication helper and all validators, including Interactive Practice.
- Security: publication RPC is SECURITY DEFINER with empty search path; PUBLIC revoked; authenticated granted. Trigger helper is invoker and schema-qualified.
- Data risk: lifecycle-changing. It archives the current published version, publishes the selected draft, updates `lessons.current_published_version_id`, and promotes lesson/unit/course status. The transaction rolls back on any error. It deliberately supersedes `202607220008` and `202607230002` publication bodies.
- Later replacements: no later migration replaces the RPC; `202607240002.publish_course` calls it.
- Disposable execution: safe and mandatory before remote deployment.

### `202607240001` — draft-version mutation hardening

- Purpose: permits draft version editing beneath published course/unit/lesson rows while retaining owner/admin authorization.
- Creates/changes: `can_edit_lesson_version(bigint)`; replaces `is_draft_activity(bigint)`; dynamically recreates 19 existing mutation functions after removing three literal parent-status predicates.
- Dependencies: ownership helpers from `202607230002`; every named mutation function must already exist. Missing names are silently skipped, so inspection must confirm the expected set.
- Security: both helpers are SECURITY DEFINER with empty search paths; anon/PUBLIC revoked and authenticated granted. Recreated functions preserve their existing definitions and security attributes through `pg_get_functiondef`.
- Data risk: the broadest implementation risk. Textual `replace()` depends on exact stored function formatting and removes all exact occurrences of the three predicates. It does not explicitly inject `can_edit_lesson_version`; safety relies on existing `can_edit_drafts`, RLS, `is_draft_activity`, and the ownership trigger. Local catalog inspection and behavioral tests are required.
- Later replacements: none of the rewritten mutation functions are replaced by `202607240002`.
- Disposable execution: safe, but a zero-to-head reset and behavior tests are deployment gates.

### `202607240002` — atomic course publication

- Purpose: validates an entire course, reports all validation errors without mutation, then atomically publishes every newest draft lesson version.
- Creates/changes: `publish_course(bigint) returns jsonb`.
- Dependencies: owner-aware `can_publish_course`, hierarchy gate, all subtype tables/validators, `publish_lesson_version` from `202607230004`, and draft-version editing behavior from `202607240001`.
- Security: SECURITY DEFINER, empty search path, PUBLIC/anon revoked, authenticated granted; internal authorization determines teacher/publisher/admin authority.
- Data risk: lifecycle-changing and course-wide. It locks the course/hierarchy, prefers the latest draft, retains the active published version when no draft exists, aggregates validation errors, then publishes in one transaction. Any uncaught error rolls back the function call. Interactive Practice can never pass because its publication validator deliberately raises even when complete.
- Later replacements: none.
- Disposable execution: safe and mandatory.

## Dependency and static safety conclusions

The exact pending dependency chain is linear: `220008 → 230001 → 230002 → 230003 → 230004 → 240001 → 240002`. Filename order is correct.

- Duplicate definitions are intentional replacements: `publish_lesson_version` is successively defined in earlier applied migrations, `220008`, `230002`, and finally `230004`; `protect_publishable_content` is finally replaced by `230004`; `is_draft_activity` is finally replaced by `240001`.
- No incompatible `CREATE FUNCTION` collision was found; changed bodies use `CREATE OR REPLACE` with unchanged signatures. `230002` intentionally renames `duplicate_draft_course(bigint)` before creating its owner-checking wrapper.
- Required helpers are introduced before use. `230002` depends on the Interactive Practice table, which is why `220008` must precede it.
- Enum values are added before use and no code relies on enum sort order.
- Pending RLS references use schema-qualified helpers. No pending policy references an absent helper in the required order.
- Pending security-definer functions use an explicit empty search path and schema-qualified object references.
- No pending migration grants draft/private table access to anon. Authenticated table access remains constrained by RLS; direct Interactive Practice mutations remain ungranted.
- No trigger name collision is unresolved: ownership triggers are dropped/recreated per table, and existing lifecycle/versioning triggers remain separate. Actual firing order and interaction must be validated locally.
- No pending migration references a column added by a later pending migration.

## Required RPC audit

All signatures below are in schema `public`. PostgreSQL function ownership remains the migration executor/database owner; SECURITY DEFINER therefore requires the explicit internal checks shown.

| Function | Effective source | Signature / return | Security and search path | Execute grants | Remote before Dell | Frontend compatibility |
| --- | --- | --- | --- | --- | --- | --- |
| `is_platform_admin` | `202607230002` | `() → boolean` | DEFINER; `''` | authenticated only; PUBLIC/anon revoked | No | `AdminRoute` falls back to legacy permission mode only for structured missing-function errors. |
| `can_view_all_courses` | `202607230002` | `() → boolean` | DEFINER; `''` | authenticated only; PUBLIC/anon revoked | No | Same `AdminRoute` missing-RPC fallback. |
| `can_manage_content` | created `202607170002`, replaced `202607230002` | `() → boolean` | DEFINER; `''` | authenticated; anon/PUBLIC revoked | Yes, old editor/publisher/admin semantics | It is the legacy compatibility surface and remains required. |
| `can_edit_lesson_version` | `202607240001` | `(bigint) → boolean` | DEFINER; `''` | authenticated only; PUBLIC/anon revoked | No | No missing-RPC fallback found; deployment must precede use of the new contract. |
| `publish_lesson_version` | final body `202607230004` | `(bigint) → lesson_versions` | DEFINER; `''` | authenticated; PUBLIC revoked | Yes, earlier applied body | No missing-RPC fallback; the existing name/signature provides rollout compatibility, but behavior changes after migration. |
| `publish_course` | `202607240002` | `(bigint) → jsonb` | DEFINER; `''` | authenticated only; PUBLIC/anon revoked | No | Frontend recognizes missing-function responses and presents publication as unavailable; it does not simulate publication. |
| `create_draft_interactive_practice` | `202607220008`, rewritten by `202607240001` | `(bigint,text) → lesson_activities` | DEFINER; `''` | authenticated only; PUBLIC/anon revoked | No | No fallback; activity creation must fail until deployed. |
| `duplicate_draft_course` | `202607220007`, wrapped by `202607230002` | `(bigint) → courses` | DEFINER; `''` | authenticated only; PUBLIC/anon revoked | Yes, pre-ownership body | Same signature; no fallback required, but behavior becomes owner-scoped. |
| `duplicate_draft_unit` | `202607220007`, rewritten by `202607240001` | `(bigint,bigint) → units` | DEFINER; `''` | authenticated only; PUBLIC/anon revoked | Yes | Same signature; no missing-RPC fallback found. |
| `duplicate_draft_lesson` | `202607220007`, rewritten by `202607240001` | `(bigint,bigint) → lessons` | DEFINER; `''` | authenticated only; PUBLIC/anon revoked | Yes | Same signature; no missing-RPC fallback found. |

Key dependencies: role helpers read `user_roles`; owner helpers read `courses.owner_user_id`; edit/version helpers traverse course → unit → lesson → version; publication functions call hierarchy locking and every subtype/media validator; duplication functions traverse the draft hierarchy and copy subtype rows while reusing media IDs.

## SQL test audit

Tests run lexically:

1. `010_published_learner_delivery.sql` — 53 assertions covering published catalog/current-version delivery, stale/draft/unpublished isolation, answer-safe quiz and AI projections, schema versions, execute grants, helper revocation, direct question/option access, and anon/authenticated/service-role calls. Creates its own admin/auth/content fixtures, mutates publication lifecycle inside a transaction, and rolls back. Requires migrations through learner delivery plus later publication/ownership compatibility. Likely failures: owner backfill/insert trigger assumptions, newer publication uniqueness behavior, AI configuration schema, or projection changes.
2. `011_ai_mission_spanish_instructions.sql` — 5 pure validation assertions for absent/valid/blank/non-text/oversized Spanish instructions. Uses only a temporary fixture and rolls back. Requires `202607220003`. Low mutation risk; likely failure is validator drift.
3. `012_listening_publication_validation.sql` — 2 assertions for missing versus attached managed audio. Creates an admin, hierarchy, and draft media row; mutates data and rolls back. Requires `202607220004`. Likely failures: ownership trigger/required owner setup or stricter media validation.
4. `013_pronunciation_block_validation.sql` — 6 assertions for word-list/minimal-pair JSON and version publication validation. Creates admin/content fixtures, updates entries, rolls back. Requires `202607220005`. Likely failures: JSON contract or owner enforcement drift.
5. `014_interactive_practice_admin_access.sql` — 13 assertions for canonical helper shape, no obsolete helper, anon/learner isolation, editor/publisher/admin access, token refresh, and empty-search-path RLS resolution. Creates four users and a draft graph; mutates and rolls back. Requires `202607220008`; after ownership migration its editor-created course receives ownership through the insert trigger. Likely failures: enum/table migration, role/RLS changes, or helper grants.
6. `015_teacher_ownership.sql` — 21 assertions for creator ownership, owner isolation, teacher duplication/publication, publisher cross-owner publication, administrator global authority, and learner private-course isolation. Creates five users/two complete private graphs, publishes versions, duplicates data, updates a course, and rolls back. Requires `202607230002` plus the final publication body for effective head behavior. Likely failures: owner position uniqueness, backfill/trigger logic, publication validators, or policy visibility.
7. `016_draft_version_mutation_hardening.sql` — 4 catalog/privilege assertions only. No fixtures or behavior mutations. Requires `202607230003` and `202607240001`. It can run after reset, but it does not prove drafts beneath published parents are editable or owner-isolated.
8. `017_publish_course_workflow.sql` — 7 shape, SECURITY DEFINER, privilege,
   and exact empty-search-path assertions. No role or course fixtures and no
   publication call. Requires `202607240002`. It can run after reset, but it
   does not prove validation aggregation, rollback, atomic pointer activation,
   editor denial, or teacher/publisher/admin authority.
9. `018_content_ownership_trigger.sql` — 11 behavioral assertions covering
   course creation, server-assigned ownership, owner updates, immutable
   ownership, child insertion/resolution, teacher cross-owner isolation, and
   administrator child authority. Requires `202608060001`; creates isolated
   users/content and rolls back.

Every test is transaction-scoped and intended to run immediately after a successful local reset. Tests create their own users/fixtures except `011`, `016`, and `017`; they do not require persistent seed users.

### Confirmed regression gaps before remote deployment

The suite does not currently prove all readiness claims. These are deployment blockers to address on the Lenovo in a separate backend/test change, not edits to make during the first Dell pass:

- behavioral proof that draft versions beneath published course/unit/lesson rows remain editable through each rewritten specialist RPC;
- end-to-end `publish_course` success, aggregated failure with zero lifecycle mutation, current-version activation, prior-version archival, and transaction rollback;
- explicit editor publication denial for `publish_lesson_version` and `publish_course`;
- explicit administrator and publisher `publish_course` cross-owner success;
- direct authenticated INSERT/UPDATE/DELETE privilege revocation checks for answer-bearing Interactive Practice and quiz tables;
- published learner projection behavior when Interactive Practice exists (currently publication is deliberately blocked, so the expected contract should be asserted);
- trigger interaction/order checks after `enforce_content_ownership` is installed on all versioned tables.

Media visibility and quiz answer safety have meaningful coverage in `010`, but shared draft media ownership remains a documented product limitation rather than a per-course isolation guarantee.

## Backend readiness checklist

Do not approve remote deployment until all items are evidenced by captured local output or an added regression test:

- [ ] Full 25-migration chain executes from zero via `db reset --local`.
- [ ] SQL files `010`–`018` all pass with no plan mismatch.
- [ ] All eight post-`202607220007` versions appear in the local migration ledger.
- [ ] Every RPC signature and return type in the RPC table exists exactly once.
- [ ] Authenticated execute grants and anon/PUBLIC revocations match the RPC table.
- [ ] Every SECURITY DEFINER function has an explicit empty search path.
- [ ] Administrator cross-owner read, edit, lesson publication, and course publication work.
- [ ] Teachers can read/edit/publish owned courses and cannot see or mutate another teacher's private hierarchy.
- [ ] Publishers can read and publish across owners but cannot author drafts.
- [ ] Editors can author owned drafts but cannot publish lessons or courses.
- [ ] Anonymous users and ordinary authenticated learners cannot access private draft hierarchy or answer-bearing subtype data.
- [ ] Interactive Practice creation/save/duplicate work for authorized staff; direct table mutation remains unavailable; learner publication stays blocked until an answer-safe delivery contract exists.
- [ ] Published learner projections omit quiz correctness/explanations and unknown/private AI fields.
- [ ] Draft versions beneath published hierarchy metadata remain editable through every specialist mutation path.
- [ ] `publish_lesson_version` validates, archives the previous active version, activates the new pointer, and rolls back atomically on failure.
- [ ] `publish_course` validates the entire course, reports all errors without mutation, and publishes all eligible lessons atomically.
- [ ] Direct table mutation privileges remain restricted for lifecycle and answer-bearing tables.

## Artifacts to return to the Lenovo

Copy the complete `.dell-validation` directory without editing its contents:

- full PowerShell transcript;
- Docker and Supabase CLI versions;
- Supabase start/reset/test/status logs;
- local migration list;
- readiness inspection output, if the reviewed inspection SQL exists;
- exact `git rev-parse HEAD` and final `git status --short --branch` output;
- Docker Desktop diagnostic bundle only if containers fail to start.

Also report the first failing migration/test name, exact error, command exit code, and whether cleanup completed. Do not bring back database credentials, access tokens, or generated local service keys.

## Success criteria

The corrective Dell pass succeeds only when the exact handoff commit is clean,
local Supabase starts, reset executes migrations `202607170001`–`202608060001`
from zero, all SQL tests through `018` pass, local catalog inspection matches
the required RPC/security state, all logs are captured, and local services
stop cleanly. Passing the current suite does not by itself close the remaining
course-publication behavioral gaps above; those gaps must be tested before
remote deployment.
