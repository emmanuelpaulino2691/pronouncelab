# Development

## Contents

- [Principle](#principle)
- [Inspect](#inspect)
- [Plan and implement](#plan-and-implement)
- [Security-sensitive work](#security-sensitive-work)
- [Validation](#validation)
- [Local Supabase reset and bootstrap](#local-supabase-reset-and-bootstrap)
- [Browser smoke tests](#browser-smoke-tests)
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

Run relevant focused Vitest tests with `npm.cmd test`. The small Chromium smoke suite described below covers only high-value cross-route contracts; it does not replace focused component or database tests.

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
| Learner | `learner.pronouncelab@gmail.com` | `PronounceLabLocalLearner!2026` |

Supabase Auth intentionally shares one session across tabs on the same browser
origin. For simultaneous staff and learner browser testing, use a normal Chrome
profile for Admin/Teacher and an Incognito window or separate browser profile
for Learner. Signing in as a different account in another tab replaces the
session for every tab; the application does not emulate per-tab identities.

The bootstrap also creates `Local Enrolled Class` (`953001`) with the local Learner enrolled and `Local Joinable Class` (`953002`) with join code `A52B000000000002`. Teacher testing uses `/admin/classes`; learner membership and joining use `/classes` in Incognito or a separate profile.

In the Teacher Class workspace, verify the active assignment card, Release-scoped learner rows, update review, collapsible assignment history, archive/reactivation explanation, and join-code copy/regeneration flow. Deactivation and archival confirmations must state that progress is preserved. On `/classes`, verify Not started, In progress, and Completed cards at phone and desktop widths; Completed Courses use **Review Course** and all Course actions still open the immutable Course overview.

Publishing `Local Learner Course` creates Release 1. Bootstrap assigns it to `Local Enrolled Class`, whose active enrollment authorizes the local Learner without a direct entitlement row. Open `/admin/classes/953001` as Teacher or `/classes` as Learner; the assigned Course continues through `/releases/<id>`. Release progress starts empty and does not import current/public progress.

On the Release page, Unit 1 Lesson 1 starts **Available** and all later content starts **Locked**. A locked card is not a link. A direct locked-Lesson URL displays a controlled explanation and does not receive activity content. Complete each available Lesson in order to verify Lesson and Unit unlocking; completed Lessons remain open for review.

From `/classes`, each assigned Course shows synchronized Lesson completion and **Open Course** enters the immutable Release overview. Open an available Lesson there. The Release runtime uses the full shared learner Lesson Player with pinned historical activity content and Release-only progress writes. After completing a Lesson, use **Next Lesson**; the final Lesson shows Course completion and returns to the originating Class when `classId` context is present. Test direct `/releases/<id>` entry separately to confirm its Course-overview fallback.

Opening a completed Release Lesson starts at its completion summary. **Review Lesson** browses completed activities without completion controls and always offers **Back to Lesson Summary**. **Restart Lesson** starts a fresh local practice pass from Activity 1; completing that pass returns to the summary without deleting or rewriting synchronized completion.

When testing **Next Lesson**, verify that an incomplete destination opens its own player rather than the previous Lesson summary. Repeat from normal completion, Review, and Restart; overview entry, direct URL, refresh, and Next Lesson must agree on the destination Lesson's authoritative completion state.

Override the development passwords without editing tracked files:

```powershell
$env:PRONOUNCELAB_LOCAL_ADMIN_PASSWORD = "your-local-admin-password"
$env:PRONOUNCELAB_LOCAL_TEACHER_PASSWORD = "your-local-teacher-password"
$env:PRONOUNCELAB_LOCAL_LEARNER_PASSWORD = "your-local-learner-password"
npm.cmd run local:bootstrap
```

The defaults are deliberately local-only and are never used for a linked or
remote project. The bootstrap refuses non-loopback Supabase API URLs and reads
the temporary local service credential from `supabase status`; no service key,
JWT, or production password is stored in the repository.

The bootstrap creates two deliberately separate fixtures.

### Authoring fixture

The teacher owns this reusable draft hierarchy:

`Local Authoring Fixture → Fixture Unit → Fixture Lesson → Draft Version 1`

After login, open Lesson Studio directly at
`http://127.0.0.1:3000/admin/lessons/951021/studio`.

This fixture remains draft and learner-invisible. It is for Lesson Studio,
authoring, Version 1, and publication testing.

### Learner progression fixture

`Local Learner Course` (`952001`) is fully published through the normal course
publication RPC. It contains:

- `Progression Unit 1` (`952011`): Lessons `952021`, `952022`, and `952023`;
- `Progression Unit 2` (`952012`): Lessons `952024` and `952025`.

Each Lesson has one small published Learn activity and requires no Storage or
external service. The learner starts with no progress: Unit 1 and Lesson 1 are
available, later Lessons are sequentially locked, and Unit 2 unlocks only after
all three Unit 1 Lessons are complete.

This Course is **Class only**. Test it through the `Local Enrolled Class` assignment at `http://127.0.0.1:3000/classes`; it is intentionally absent from Course Library and its mutable `/courses/952001` journey is denied.

### Course Library visibility fixtures

- `Local Public Course` (`954001`) appears at `http://127.0.0.1:3000/courses` for independent practice.
- `Local Unlisted Course` (`955001`) is absent from the library and can be redeemed by the local learner at `http://127.0.0.1:3000/shared/local-unlisted-course-share-52e`.
- `Local Learner Course` (`952001`) remains the Class-only assigned fixture.

Unlisted redemption requires the authenticated learner account. Its deterministic token exists only for local testing. Use a normal browser profile for Teacher/Admin and Incognito or a separate profile for the Learner because one origin shares one Supabase session across tabs.

For Sprint 52F learner navigation QA, verify `/` contains only the `Local Enrolled Class` assignment, `/classes` labels Teacher-assigned Class Progress, `/courses` contains Public/Unlisted Independent Practice only, and `/progress` shows Class Progress and Independent Practice as separate sections. Test the drawer at phone width and confirm the active item is announced visually for Home, My Classes, Course Library, and Progress.

### Browser, keyboard, and responsive QA matrix

For learner/Teacher regression passes, use a normal browser profile for Teacher or Admin and Incognito or a separate profile for the Learner. Tabs in one profile intentionally share one Supabase Auth session.

Exercise the primary routes at approximately 360, 390–430, 768, 1024, and 1280+ CSS pixels. At each relevant width verify keyboard-only navigation, visible focus, readable wrapping, touch-sized controls, and no unintended horizontal page scrolling. Cover Home, My Classes, Course Library, Progress, both Course overviews, both Lesson runtimes, `/login`, Courses, Classes, Class workspace, Lesson Studio, and Media Library.

Route navigation moves focus to the main content region. Mobile learner navigation traps focus while open, closes on Escape or route selection, restores focus to its opener, and locks background scrolling. Lifecycle confirmations use the shared accessible dialog. Manual browser reasoning remains required; the repository does not currently include a browser or axe runtime, so no new E2E command is claimed.

Useful learner URLs:

- Home: `http://127.0.0.1:3000/`
- Course: `http://127.0.0.1:3000/courses/952001`
- Unit 1: `http://127.0.0.1:3000/units/952011`
- First Lesson: `http://127.0.0.1:3000/lessons/952021`

A reset invalidates browser sessions because their Auth users no longer exist.
The application verifies restored sessions before redirecting and clears only
invalid Supabase Auth state. Learner progress and other PronounceLab local
storage remain untouched.

## Browser smoke tests

The Playwright smoke suite uses Chromium and the deterministic local bootstrap identities. It intentionally covers a few cross-route contracts rather than duplicating Vitest or pgTAP coverage.

First-time browser installation:

```powershell
npx.cmd playwright install chromium
```

Local prerequisites are explicit so the test runner does not leave fragile background processes behind:

```powershell
# Terminal 1
npx.cmd supabase start
npm.cmd run local:bootstrap

# Terminal 2
npm.cmd run dev

# Terminal 3
npm.cmd run test:smoke
```

Edge Functions are not required. The suite uses `http://127.0.0.1:5173` and refuses to start when `VITE_SUPABASE_URL` resolves to anything other than localhost or `127.0.0.1`. Do not override that guard or point the tests at a hosted project.

The smoke suite signs in with the documented local Teacher and Learner fixtures. Simultaneous identities use separate Playwright browser contexts because one Supabase session is shared within a browser profile. Manual Teacher/Learner testing likewise requires separate browser profiles or Incognito.

Bootstrap also creates two browser-test-owned learners, `Smoke Joinable Class`, `Smoke Completion Class`, and a two-Lesson immutable `Smoke Assignment Course`. It writes a gitignored `tests/smoke/.local-fixture.json` descriptor containing only local stack coordinates, the local database container, and those test user IDs. Mutation setup validates both API and database hosts as localhost and validates the expected container/UUID shapes before it can run.

Before each mutating test, Playwright resets only its fixture-owned rows:

- Join Class deletes only the Smoke Join learner's enrollment in Class `953102`.
- Completion deletes only the Smoke Completion learner's Release activity/Lesson progress.

The setup executes the scoped SQL inside the local Supabase database container. It never clears manual learner progress, independent-practice progress, shared Classes, or the database as a whole. A failed test is recoverable because the next run establishes its preconditions before browser navigation. Rerun `npm.cmd run local:bootstrap` if the descriptor or dedicated fixtures are missing; otherwise rerunning `npm.cmd run test:smoke` is sufficient. Docker access is therefore required for the mutation tests.

Failures produce a screenshot and retained trace under `test-results/`; successful runs do not record video or trace artifacts. Inspect a trace with:

```powershell
npx.cmd playwright show-trace test-results/<test-name>/trace.zip
```

The suite remains single-worker. Dedicated identities and pre-test resets remove ordering dependence, but parallel execution stays disabled until each future mutating flow receives exclusive fixture ownership. Headed mode remains available with `npm.cmd run test:smoke -- --headed`.

The suite is state-isolated and now has a GitHub Actions workflow; its first hosted run remains the acceptance gate for runner-specific behavior.

### GitHub Actions verification

`.github/workflows/quality-and-browser-smoke.yml` runs for every pull request and for pushes to `main`. Feature-branch pushes without a pull request do not run it, avoiding duplicate executions while preserving merge protection and main-branch verification. Workflow permissions are read-only.

The workflow has two independent Ubuntu jobs:

- **Build, lint, and Vitest** uses Node 24, `npm ci`, and the normal build/lint/test commands.
- **Local Supabase and Chromium smoke** installs pinned Supabase CLI `2.114.0`, starts an ephemeral Docker stack, resets migrations from zero to head, verifies migration `202608190003`, bootstraps fixtures, installs Chromium, waits for Vite over HTTP, and runs all smoke tests with one worker.

CI passes `PRONOUNCELAB_SUPABASE_CLI=supabase` only to bootstrap so it uses the pinned executable installed by the workflow instead of asking `npx` to resolve another CLI version. Normal Windows development retains the existing `npx.cmd supabase` commands.

CI writes `.env.local` from the ephemeral `supabase status -o env` output only after asserting the API is exactly `http://127.0.0.1:54321`. No repository or production secrets are used. The Playwright configuration and fixture reset helper retain their own localhost checks. The workflow never links a project, pushes migrations, deploys Functions/frontend code, or accesses remote Storage.

Chromium is installed with `npx playwright install --with-deps chromium`. Browser binaries are not cached initially: avoiding stale or incomplete browser/system-library caches is more valuable than the expected download saving. npm packages use `setup-node`'s lockfile-keyed npm cache.

When smoke tests fail, GitHub uploads `test-results/` for seven days. Download `playwright-failure-artifacts` from the failed workflow run and inspect a trace locally:

```powershell
npx.cmd playwright show-trace path\to\trace.zip
```

Supabase container status and the final 200 Vite log lines are printed on failure without printing generated local keys. CI remains single-worker because each mutating flow owns one fixture but the current suite intentionally favors deterministic serialization over speed. The local Windows workflow above is unchanged and is the closest pre-push equivalent.

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
## Assignment scheduling checks

Use the Class timezone selector when testing datetime-local assignment fields.
The browser form sends an instant; the database stores UTC and validates
availability/due ordering in trusted RPCs. Test upcoming, available, and late
states without waiting for the wall clock by using controlled timestamps in
local fixtures. No notification, grace-period, or per-learner extension
behavior is implemented yet.

## Assignment notification checks

Time-based notification behavior is deterministic through
`process_assignment_notifications_at(test_timestamp)`; do not wait for wall
clock transitions in browser tests. Reset local Supabase and run the focused
notification pgTAP test when changing its migration. Staff Preview must not
fabricate a learner inbox.

Notification UI checks should cover Remove, Clear read, unread badge updates,
and the 90-day read-retention rule. These operations are soft-dismissals and do
not alter Assignment or learner progress data.
