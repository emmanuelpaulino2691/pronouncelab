# Development

## Contents

- [Principle](#principle)
- [Inspect](#inspect)
- [Plan and implement](#plan-and-implement)
- [Security-sensitive work](#security-sensitive-work)
- [Validation](#validation)
- [Local Supabase reset and bootstrap](#local-supabase-reset-and-bootstrap)
- [Git and deployment](#git-and-deployment)
- [Documentation maintenance](#documentation-maintenance)

## Principle

PronounceLab development is inspection-first. The codebase contains deliberate security, versioning, stale-request, and local/static boundaries that are easy to break with an isolated component change.

## Inspect

Before editing:

```powershell
git status --short --branch
rg --files
```

Then trace the requested behavior:

- frontend: route → layout/page → component/hook → service → types;
- content: provider → registry → fixture/domain data → renderer;
- database: table → policy → helper → trigger → RPC → grants and later migrations;
- mutation: expected parent, lifecycle, concurrency token, stale navigation result;
- UI: desktop/mobile, keyboard, loading/error/empty/read-only.

Why: reading only the named file can miss a later migration replacement, an RLS condition, or a shared renderer contract.

## Plan and implement

1. Explain the smallest coherent plan and likely files.
2. Reuse existing services, types, utilities, and UI.
3. Preserve behavior not in scope.
4. Use strict TypeScript; avoid `any`.
5. Keep asynchronous work cancellable or sequence-scoped.
6. Confirm exact-row mutations before showing success.
7. Keep copy/paste and external data as text.
8. Review the final diff for accidental learner, migration, environment, or package changes.

“Never redesign” means do not replace established architecture as a shortcut. A requested architectural change is valid only after its effects and migration path are explicit.

## Security-sensitive work

### RLS and permissions

The browser never grants authority. Preserve RLS and internal RPC checks. Route access (`canAccessAdmin`) is wider than draft editing (`canEditDrafts`).

### Publication

Do not directly set published lifecycle states. Preserve the gate-first publication workflow, immutable published descendants, media verification, and answer-key projections.

### Backward compatibility

Learner routes use static IDs and `localContentProvider`. Admin services use Supabase IDs. Do not join them implicitly. Keep existing routes and fixture data compatible unless a migration plan is explicitly requested.

## Validation

Required after changes:

```powershell
npm.cmd run build
npm.cmd run lint
npm.cmd test
git diff --check
```

- Build catches TypeScript and bundling errors.
- Lint catches repository coding-policy violations.
- Diff check catches whitespace errors that compilers ignore.

Run relevant focused Vitest tests with `npm.cmd test`. Browser and database integration test infrastructure is not configured; report that limitation rather than inventing coverage.

For database changes:

```powershell
npx supabase db push --dry-run
npx supabase migration list
```

When possible, execute all migrations in a disposable local Supabase instance. A linked dry run does not execute function bodies. Never reset or push the remote database unless requested.

Finish with:

```powershell
git status --short
git diff --stat
git diff
```

## Local Supabase reset and bootstrap

Start the local stack normally, then use this controlled reset workflow:

```powershell
npx.cmd supabase start
npx.cmd supabase db reset --local
npx.cmd supabase test db
npm.cmd run local:bootstrap
npm.cmd run dev
```

Database tests run before the bootstrap because they intentionally assume an
empty learner catalog. `supabase/config.toml` therefore does not automatically
seed manual-development data. The single bootstrap command is idempotent and
uses the supported local Auth Admin API plus a local PostgreSQL transaction; it
does not alter remote systems or weaken browser/service-role grants.

The local accounts are:

| Role | Email | Default local-only password |
| --- | --- | --- |
| Admin | `admin.pronouncelab@gmail.com` | `PronounceLabLocalAdmin!2026` |
| Teacher | `emmanuelpaulino2691@gmail.com` | `PronounceLabLocalTeacher!2026` |

Override the development passwords without editing tracked files:

```powershell
$env:PRONOUNCELAB_LOCAL_ADMIN_PASSWORD = "your-local-admin-password"
$env:PRONOUNCELAB_LOCAL_TEACHER_PASSWORD = "your-local-teacher-password"
npm.cmd run local:bootstrap
```

The defaults are deliberately local-only and are never used for a linked or
remote project. The bootstrap refuses non-loopback Supabase API URLs and reads
the temporary local service credential from `supabase status`; no service key,
JWT, or production password is stored in the repository.

The teacher owns this reusable draft hierarchy:

`Local Authoring Fixture → Fixture Unit → Fixture Lesson → Draft Version 1`

After login, open Lesson Studio directly at
`http://127.0.0.1:3000/admin/lessons/951021/studio`.

A reset invalidates browser sessions because their Auth users no longer exist.
The application verifies restored sessions before redirecting and clears only
invalid Supabase Auth state. Learner progress and other PronounceLab local
storage remain untouched.

## Git and deployment

- Never commit or push unless requested.
- Never switch branches without permission.
- Never discard or overwrite user changes.
- Avoid destructive Git commands.
- Do not apply migrations merely because they validate.
- Do not edit `.env` or introduce secrets.
- Do not install dependencies without approval.

These rules separate implementation review from irreversible/shared-state operations.

## Documentation maintenance

Update the canonical document when changing:

- routes/folder architecture → [Architecture](ARCHITECTURE.md);
- tables/RLS/RPC/publication → [Database](DATABASE.md);
- activity/editor/renderer contracts → [Lesson System](LESSON_SYSTEM.md);
- AI format/parser/workflow → [AI Speaking Mission](AI_SPEAKING_MISSION.md);
- learner progress/navigation → [Student Experience](STUDENT_EXPERIENCE.md);
- durable decisions → add or supersede an [ADR](ADR/).

Label future behavior. Do not copy SQL or repeat long explanations already linked elsewhere.
