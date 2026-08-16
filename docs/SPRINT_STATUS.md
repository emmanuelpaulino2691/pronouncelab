# Sprint Status

## Sprint 52F — Learner Home & Navigation Consolidation

Implemented locally as a frontend/service-composition increment. Learner navigation is Home, My Classes, Course Library, and Progress. Home loads only active Class assignments, orders incomplete work by meaningful Release activity, and distinguishes no Classes, no assignments, and completed work. My Classes owns joining and Class Progress; Course Library owns Public/redeemed-Unlisted Independent Practice; Progress presents the two progress contexts separately. No database, RLS, progress identity, assignment, or publication contract changed.

## Sprint 52E — Course Library, Visibility & Learner Experience Separation

Implemented locally. Publishing now prepares immutable Releases without making Courses globally discoverable. Courses default to Class only; Public Courses appear in Course Library, while authenticated Unlisted practice uses revocable, hash-stored share links. Learner Home contains active Class assignments only. Course Library owns independent-practice resume state and the current/public Lesson runtime now matches Release UX for sequential overview, completion summary, review, restart, and Next Lesson while preserving separate progress adapters. See ADR 0015.

## Sprint 52D — Assignment Experience & Lifecycle UX

Implemented locally as a frontend-only increment. Teacher Class workspaces now present active immutable Release assignments, completion summaries, responsive learner progress, explicit newer-Release review and confirmation, ordered assignment history, and clear archive/deactivation preservation semantics. Join codes support copy and explained regeneration. Learner Class cards show Release-only Not started, In progress, or Completed state with Open/Review Course actions. Availability and due dates are explicitly deferred; no database or authorization contract changed.

## Sprint 52C — Class → Course Release Assignments

Implemented locally. Teacher-owned Classes can assign owned immutable Course Releases, explicitly move to newer Releases while preserving history, deactivate assignments, and view active-roster Release-scoped progress. Learners see assigned Courses through `/classes`; access derives from active enrollment + active Class + active assignment and immediately follows lifecycle changes without copied entitlements. Bootstrap exercises the production relationship. See ADR 0014.

The learner UX follow-up adds per-assignment progress with Course-overview entry, persistent Class URL context, and shared full-activity Lesson Player delivery with an injected Release progress adapter. Its completion screen provides authoritative cross-Unit Next Lesson navigation without changing database or progress identity contracts.

Completed Release Lesson UX now distinguishes the authoritative summary, browse-only Review, and local-only Restart practice sessions. Review and repeated Restart cannot downgrade or redundantly rewrite synchronized Release progress, and both retain explicit paths back to the summary and forward to eligible content.
Release Lesson navigation keys the complete runtime by immutable Release Lesson identity. Next Lesson, direct entry, refresh, Review, and Restart therefore cannot carry presentation or completion state into another Lesson when React reuses the route.

## Sprint 52C prerequisite — Immutable Releases + Release Runtime

**Status:** Implemented locally; manual browser QA and deployment pending.

Delivered atomic fingerprinted Course Release manifests, historical exact-version delivery, entitlement-protected Release routes, Release-scoped progress and eligibility, immutable manifest enforcement, deterministic bootstrap entitlement, pgTAP coverage, and ADR 0013. Class Course assignments are intentionally not implemented.

## Sprint 52B — Classes + Enrollment Foundation

**Status:** Implemented locally; manual browser QA and deployment pending.

Delivered teacher-owned active/archived Classes, regenerable secure join codes, learner memberships, soft enrollment lifecycle, owned rosters, controlled enrollment-scoped progress summaries, Teacher and Learner Classes UX, pgTAP privacy coverage, and deterministic bootstrap fixtures. Assignments and immutable Course releases remain future work.

## Sprint 52A — Learner Identity and Synced Progress Foundation

**Status:** Implemented locally; manual browser QA and deployment pending.

Delivered ordinary authenticated learner identity, owner-scoped monotonic Lesson/activity progress, current-published-content validation, local/server reconciliation, offline-safe local writes, cross-device server reads, synchronized journey derivation, Preview isolation, a deterministic local learner account, pgTAP/Vitest coverage, and ADR 0011. Classes, enrollment, assignments, attempts, scoring, reset of authoritative history, and teacher reporting are not implemented.

## Sprint 51C — Media Library Content Deduplication

Implemented locally. Audio and image uploads are registered by trusted SHA-256
of stored bytes and deduplicated within the uploading owner and media kind.
Concurrent equal registrations serialize at the database, return one stable
UUID, and remove the redundant draft Storage object. Published stable media is
reused without changing Version 2 publication behavior. Media Library reads
use an RLS-preserving canonical view, so trusted historical duplicates collapse
to one card without rewriting immutable references. Media Library access
and draft mutations are owner-scoped for teachers and platform-wide for admins.
Historical duplicate rows and immutable references are not rewritten. See
[ADR 0010](ADR/0010-owner-scoped-media-content-identity.md).

## Sprint 51C prerequisite — Reproducible Local Bootstrap

Implemented locally. Destructive local resets are followed by one idempotent
bootstrap command that recreates the Admin and Teacher Auth accounts, their
roles, and a minimal teacher-owned Course → Unit → Lesson → Draft Version 1
fixture. Manual fixtures remain separate from schema migrations and pgTAP so
empty-catalog database tests stay deterministic. Invalid sessions left by a
reset are verified and locally signed out instead of bouncing between Login
and Admin routes; learner progress storage is not cleared.

## Sprint 51B — Learner Progression and Controlled Draft Cleanup

Implemented locally. Learn audio blocks deliver their saved label and transcript
to learners without changing Listening's optional transcript toggle. Course and
Unit pages retain the recommended-next highlight while their complete lists now
include the current item and show sequential Current, In progress, Completed,
and Locked states. Direct future Unit and Lesson routes enforce the same
device-local completion prerequisites.

Publish updates validates new draft structure and draft lesson versions without
revalidating sealed historical lesson versions. Blockers name the Unit, Lesson,
activity, activity type, and missing requirement. Draft activity deletion now
works under published ancestors through an owner-scoped, parent-scoped,
leaf-first RPC; published activities and versions remain protected.

## Sprint 51A — Progressive Course Authoring

Implemented and validated locally. Published courses accept new draft units and
published units accept new draft lessons without making released rows mutable.
Creation is RPC-only, owner-scoped, hierarchy-gated, and append-only. New
lessons receive draft Version 1 atomically. Draft additions remain editable,
safely deletable, and learner-invisible.

After the first release, publication is presented as **Publish updates**. It
retains all-or-nothing validation: incomplete additions stay private while
existing learner content remains available. See
[ADR 0009](ADR/0009-progressive-course-authoring.md).

## Sprint 50G Follow-up — Version 2 Republication

Implemented and validated locally against the preserved Version 1 → Version 2
reproduction. Version 2 publication had passed every content and media
validator, but `publish_lesson_version` rewrote the already-published lesson's
`published_at` while advancing `current_published_version_id`; the sealed-row
trigger correctly rejected that unrelated timestamp mutation. The forward fix
preserves the lesson's first publication timestamp while the new version keeps
its own release timestamp. Version 1 becomes archived immutable history and
Version 2 becomes the current learner-visible publication in one database
transaction.

Published stable media UUIDs remain reusable and are skipped by media
prepare/finalize. Edge Function failures now log the failing orchestration step
and unsanitized backend diagnostics server-side while keeping unexpected
details out of browser responses. Regression coverage exercises Version 1
publication, draft copying and editing, stable-media reuse, owner isolation,
Version 2 activation, learner delivery, immutable history, and atomic rejection
of incomplete content.

## Sprint 50G — Published Lifecycle and Learner Delivery Audit

Implemented and validated locally. Published Learn media controls are absent
from read-only editors, while RLS and hierarchy triggers continue rejecting
published descendant changes for teachers and administrators. Draft Version 2
copying now crosses both AI creation guards without granting direct AI inserts;
it preserves the complete descendant tree and stable media UUIDs while Version
1 remains the active immutable publication.

Course publication on the preserved hierarchy completed successfully in the
database and Edge Function. The learner Course, Unit, and Lesson routes had
mistaken a successful resource state (`error === null`) for an infrastructure
failure; they now distinguish success, not-found, loading, and actual errors.
The learner SQL projection continues requiring published course, unit, lesson,
and active lesson-version parents.

## Sprint 50F — Lesson Studio Mutation Regression Audit

Implemented and validated locally. Direct Lesson Studio mutations now cross
the private hierarchy-lock boundary through security-definer trigger entry
points while the underlying gate remains unavailable to browser roles. A
parent-scoped quiz-question delete RPC preserves leaf-first locking and delete
order. Teacher-owned Learn, Quiz, Listening, AI mission, and media-registration
mutations retain draft-only and course-owner authorization, and published
content remains immutable.

Lesson Studio mutation failures now use operation-specific sanitized messages.
The local publication hostname failure was traced to an Edge Runtime container
that had not started because its generated function mount was missing; a clean
local stack restart restored it. No remote database, function, or Storage
operation was performed.

## Sprint 50E — Media Publication and Draft-Version Blockers

Implemented locally. Lesson and course publication coordinate the existing
media prepare/finalize contract through a trusted Edge Function. Draft media is
copied and SHA-256 verified, the same stable media row is promoted to its public
bucket, and publication proceeds only after learner delivery is resolvable.

Published lessons can create a course-authorized draft copy without changing
the active published pointer. Specialist and assessment descendants receive
new IDs, including Listening questions omitted by the previous copy branch.
Known errors are actionable and unexpected backend errors remain sanitized.
Migration, function deployment, and disposable database/Storage validation are
pending on Dell. No remote database command ran during Lenovo implementation.

## Backend validation correction — ownership and pgTAP compatibility

The first Dell disposable-database pass successfully executed the complete
24-migration chain through `202607240002`. The subsequent pgTAP run exposed
three local-only validation issues: the shared ownership trigger dereferenced
the course-only `owner_user_id` field during child-table updates; the installed
pgTAP version does not provide `not_ok(boolean, text)`; and the
`publish_course` search-path assertion expected the wrong `pg_proc.proconfig`
text representation.

Implemented locally, pending a second Dell pass: forward migration
`202608060001` replaces record-field ownership checks with safe JSONB
inspection; the Spanish-instruction test uses an exact `is(..., false, ...)`
assertion; the publication test now checks the catalog representation
`search_path=""`, SECURITY DEFINER status, and grants; and focused ownership
trigger coverage verifies owner, administrator, child-hierarchy, and
cross-owner behavior. Remote deployment remains blocked until a fresh Dell
reset executes all 25 migrations and the full pgTAP suite passes.

## Sprint 49D — Course Experience

Implemented locally as a frontend-only increment. Learner Courses, Course detail, and Unit detail now form a visually prioritized Course → Unit → Lesson journey. A shared pure resolver drives Home and hierarchy recommendations, exact activity resume, state labels, progress, and Start/Continue/Review actions. Empty units and unusable lessons remain truthful but cannot be recommended or started. Completion offers review rather than inventing another lesson. Published routes, Lesson Player, Student Preview, teacher workflows, and device-local persistence contracts remain unchanged. Browser visual QA remains pending.

## Sprint 49C.1 — Home Experience Polish

Implemented locally as a frontend-only polish increment. Browse all courses is now a quiet secondary link within Your Learning Journey instead of an independent Home section. The welcome adds the Manifesto-aligned line **A few focused minutes can make English feel more familiar.** Existing lesson titles remain authoritative because the current model has no learner-purpose metadata. Learner-visible Dashboard wording has been removed; internal module names and teacher Dashboard terminology remain unchanged. A future optional `lessonPurpose` authoring concept is documented but not implemented. Browser visual QA remains pending.

## Sprint 49C — Home Experience Phase 1

Implemented locally as a frontend-only learner increment. The learner root and navigation now use **Home**. Its hierarchy is Welcome, Today's Mission, Your Learning Journey, and Browse Courses. The mission presents truthful Start, Continue, Review, unavailable-content, and everything-completed states; the journey shows only current course/unit context and real device-local lesson completion. Isolated statistics and future motivation placeholders no longer render on Home. No learner identity is invented when an authenticated learner name is unavailable. Browser visual QA remains pending.

## Sprint 49B — Next-Action Student Dashboard

Implemented locally as a frontend-only increment. Dashboard now prioritizes a valid incomplete resumed lesson, then the first incomplete lesson in the current course, then the first usable published lesson. Stale progress and empty or unavailable lesson records are ignored. The page presents exact course/unit context, browser-local lesson and course completion, accessible progress, stable loading/error/empty states, and restrained future motivation placeholders without invented values. Recent Activity remains absent because local progress has no timestamps. Browser QA remains pending.

## Sprint 49A — Student Experience Architecture

Implemented locally as a frontend-only architecture increment. The complete learner information architecture now prioritizes one truthful next action from Dashboard through Lesson Complete and defines future Progress, Achievements, Profile, Settings, Classes, and Assignments boundaries. Current Course displays real device-local unit completion and recommends the first incomplete unit. The dashboard no longer presents isolated local XP, level, or streak values as learning truth; future motivation capabilities are labelled as dependent on learner accounts and synchronized progress. Browser QA remains pending.

## Sprint 49 — End-to-End Product Review

Reviewed locally from the first-course teacher journey through publication, preview, command navigation, quick actions, and media reuse. The focused implementation opens a newly created course directly in its workspace, removes redundant or misleading first-activity entry points, removes the no-op Curriculum action, and completes keyboard focus containment in the mobile Content Studio drawer. Remaining findings are documented in the Sprint 49 handoff; browser walkthrough and backend-dependent publication validation remain pending.

## Sprint 48D — Performance and Bundle Optimization

Implemented locally as a frontend-only increment. The protected Admin route now lazy-loads with the rest of the route tree, moving Supabase out of the application entry chunk. Lesson Studio loads Learn, Listening, Pronunciation, Quiz, legacy Practice, Interactive Practice, and AI Speaking Mission editors independently with stable loading and controlled failure states. The production entry chunk decreases from 501.88 kB to approximately 293 kB and the Vite 500 kB advisory no longer appears. Browser performance QA remains pending.

## Sprint 48C — Responsive Student Shell for Teacher Preview

Implemented locally as a frontend-only increment. Teacher Preview now sends one Desktop, Tablet, or Phone mode through the complete shared Student shell and LessonPlayer. Desktop preserves the permanent sidebar; Tablet and Phone use the compact student app bar and accessible navigation drawer while lesson activity navigation remains full-width. Real learner routes retain automatic browser-responsive behavior. Browser QA remains pending.

## Sprint 48B — UX Polish & Consistency Audit

Implemented locally as a frontend-only refinement. Shared controls now use consistent touch targets, destructive styling, phone stacking, section spacing, and disabled explanations. Course, dashboard, Classes, Media Library, Smart Builder, quick actions, and Student Preview states received clearer wording, actionable empty/error states, stable loading geometry, permission-aware actions, and responsive controls. No product architecture, route, learner behavior, persistence contract, or backend operation changed. Browser visual QA remains pending.

## Sprint 48A — Global Search & Command Palette Foundation

Implemented locally without backend changes. The protected admin shell lazy-loads a global Ctrl/Cmd+K command surface with navigation, route-context course/unit/lesson/activity entries, templates, and truthful future commands. Exact/prefix/contains ranking receives a bounded recent-history boost; successful navigation uses React Router and twenty recent commands persist locally with a safe fallback. Browser QA remains pending.

## Sprint 47B — Smart Content Builder Foundation

Implemented locally without backend changes. Lesson Studio now offers a responsive template registry with detailed previews, browser-local favorites and recent templates, intelligent empty-lesson actions, preserved blank activity creation, and non-mutating Duplicate/Copy Activity dialogs for supported activity types. Backend activity-copy and template-instantiation contracts remain pending. Browser QA remains pending.

## Sprint 47A — Bulk Authoring & Content Operations Foundation

Implemented locally without backend changes. Course Workspace and Curriculum share content-operation contracts, overflow actions, validated destination dialogs, truthful unavailable states, publication indicators, drag/drop affordances, keyboard reorder fallbacks, and accessible announcements. Destination-aware unit duplication, cross-unit copy/move, archive, and persistent reorder await atomic backend deployment. Browser QA remains pending.

> Current delivery snapshot for PronounceLab with Emmanuel Paulino.

## Contents

- [Current sprint](#current-sprint)
- [Sprint objective](#sprint-objective)
- [Last completed sprint](#last-completed-sprint)
- [Completed work](#completed-work)
- [Work in progress](#work-in-progress)
- [Pending work](#pending-work)
- [Blockers](#blockers)
- [Next planned sprint](#next-planned-sprint)
- [Areas that must not be modified](#areas-that-must-not-be-modified)
- [Required validation commands](#required-validation-commands)

## Current sprint

**Sprint 40 — Teacher Ownership Foundation.**

Status: Implemented locally; migrations and SQL ownership tests are pending
database execution. Every course has one immutable authenticated owner.
Teachers receive owner-scoped private hierarchy visibility, draft authoring,
duplication, and publication. Administrators retain global access, publishers
retain cross-course read/publication authority, and legacy editors remain
owner-scoped draft authors.

Ownership is stored once on the course and inherited through the existing
hierarchy. RLS protects browser access, while an ownership trigger protects
existing security-definer mutations. Learner projections and anonymous
published-content delivery are unchanged. Classes, enrollment, sharing, and
student accounts are not implemented.

The Lesson Studio release blocker is resolved locally: authorized users now
receive an explicit **Publish lesson version** action backed exclusively by
`publish_lesson_version`. Administrators and publishers retain global
publication authority, teachers remain owner-scoped, and editors and learners
do not receive the action. Browser QA and local SQL execution remain pending.

Sprint 41 adds the first continuous-improvement workflow locally. Published
versions remain read-only; teachers can request a new draft version that copies
the published activity tree, then publish the draft as the next release.
Course-wide validation and a consolidated **Publish Course** operation remain
future work until every specialist mutation RPC accepts draft versions beneath
published parent metadata.

Sprint 41B adds `can_edit_lesson_version(version_id)` and removes parent-status
requirements from specialist draft mutation paths. Published hierarchy rows
remain sealed while their draft lesson versions are privately editable.

**Sprint 39A — Interactive Practice Foundation.**

Status: Implemented locally; database deployment and browser QA are pending.
Lesson Studio can create and edit the new `interactive_practice` activity with
Multiple Choice, True / False, Match, and Fill in the Blank modes. Draft
exercises may be incomplete, while the controlled publication operation rejects
incomplete exercise content.

Correct answers, accepted answers, matching pairs, and private explanations
remain in a staff-only subtype table. Sprint 39A does not change learner RPCs,
published learner projections, activity renderers, or scoring. Existing
`practice` and `quiz` activities remain unchanged and supported.
Complete Interactive Practice content remains blocked from publication until
Sprint 39B provides an answer-safe learner delivery contract and renderer.
The pending migration uses the canonical `can_manage_content()` authorization
helper for its staff-only RLS policy. The linked ledger confirms migration
`202607220008` is not applied; deployment and SQL execution validation remain
pending.

**Sprint 38 — Teacher Experience.**

Status: In progress. Draft courses, units, and lessons can be duplicated through
controlled, atomic RPCs. Deep copies preserve ordered activities, subtype
content, AI Speaking Mission configuration, and existing media references while
creating new draft identities and excluding published history. Copies are
appended to the current parent and use predictable **(Copy)** numbering.

Lesson Studio supports Ctrl+S (or Command+S) for the focused editor form.
Existing Escape dialog behavior, stable activity selection, dirty-editor state,
and duplicate-pending guards remain in place.

**Sprint 37 — Published Content Delivery.**

Status: In progress. Learner Dashboard, Courses, Units, Lessons, and Lesson
Player routes now use the published Supabase content provider. The provider
consumes only learner-safe catalog and current published-version RPCs. Existing
route paths and the Lesson Player shell remain unchanged, while device-local
progress accepts published string identifiers and preserves legacy numeric
identifier data.

Published activities render through the existing learner shell. Assessment
answer keys and explanations remain absent from browser projections. A narrow
forward migration extends the published pronunciation projection with the Word
List and Minimal Pairs fields; it remains pending deployment.

Sprint 36 authoring increments remain delivered as documented below.

**Sprint 36 — Studio authoring improvements.**

Status: In progress. The first increment finalizes the Course Editor address
workflow. New course addresses are generated automatically from the title,
teachers can explicitly switch to manual editing, and **Use title** restores
automatic generation. Existing course addresses remain unchanged unless a
teacher deliberately edits or regenerates them.

The second increment adds optional Spanish workflow instructions to AI Speaking
Missions. English remains the default, the generated AI prompt stays separate,
and existing missions without Spanish text remain valid. This does not add
platform-wide localization.

The third increment adds teacher-managed MP3 upload, replacement, removal, and
preview to Listening authoring, together with a clearer manual transcript
editor and an accessible learner transcript disclosure. Automatic
transcription is not implemented.

The fourth increment introduces pronunciation-specific Word List and Minimal
Pairs blocks. They extend the existing ordered `pronunciation_items` subtype
with an optional block discriminator, spelling pattern, and structured JSONB
entries. Legacy pronunciation rows remain unchanged. Controlled RPCs own block
creation, saving, deletion, and reordering, and publication rejects empty word
lists or incomplete minimal-pair content. Managed audio reuses the Listening
upload and preview path. This is a focused migration seam, not the Universal
Block System; a future universal model can migrate these two proven content
shapes after broader block requirements are established.

Release-blocker hardening now waits for course positions to load before a new
course form captures its insertion position, preserves structured Supabase save
errors for teacher-friendly mapping, and keeps Lesson Studio mounted during
window-focus and token-refresh permission rechecks. Closing the native audio
file picker therefore no longer resets the selected activity.

Additional focus hardening treats repeated same-user `SIGNED_IN` and
`USER_UPDATED` events as background authorization checks. Lesson Studio keeps
the selected activity in the `activity` search parameter, preserves valid IDs
across same-lesson data replacement, and warns before dirty activity state is
discarded. Genuine sign-out, identity changes, or lost permissions still close
the protected admin content.

The Sprint 35 published-content delivery work remains at its previously
documented state:

Status: Blueprint and ADR 0006 are complete. Phase 1 learner contracts,
mapping foundations, asynchronous provider interface, and static provider
compatibility are complete. Phase 2A learner delivery infrastructure is
complete. Phase 2B migration 010, RPC mapping, and the Supabase learner
provider are implemented and active in learner routes. Local Docker validation
is pending because Docker Desktop is unavailable. Phase 2B.1 security and
contract hardening is complete at the application/static-review level.
Migrations through 202607220006 are applied remotely. Migration
202607220007 remains local and pending deployment.

## Sprint objective

Establish private teacher-owned course hierarchies without changing learner
delivery or introducing classes and enrollment.

## Last completed sprint

**Sprint 34 — AI Speaking Mission Hardening.**

Sprint 34 implementation, application validation, and disposable
local-database validation are complete. Migration 009 is applied remotely.

## Completed work

Sprint 34 delivers:

- learner mission association by `activityId`;
- renderer access to the current activity while preserving every existing
  activity renderer;
- Lesson 3 compatibility with its mission still attached to activity 5;
- full database validation of the TypeScript mission configuration contract;
- a guarded AI activity creation path that rejects generic/direct insertion;
- dedicated atomic create and duplicate RPC compatibility;
- revocation of direct authenticated mission mutations;
- `save_draft_ai_speaking_mission` with expected `updated_at`;
- mission revisions generated with `clock_timestamp()` for distinct
  successful saves, including repeated saves in one transaction;
- conflict-safe editor refresh of authoritative mission data;
- publication rejection for missing or invalid AI mission configuration;
- duplicate-heading warnings that preserve the first parsed section;
- strict whole-value score parsing for `85`, `85%`, and `85/100`;
- focused Vitest tests for prompt, parser, score, missing-section, duplicate,
  and mission-association behavior.
- local PostgreSQL execution of migrations 001–009 from scratch;
- 24 passing local SQL checks covering the migration ledger and schema objects,
  authenticated direct-write restrictions, authorized create/duplicate/save
  RPCs, optimistic concurrency, malformed configuration rejection, publication
  completeness, and published/archived immutability;
- successful application validation: production build, lint, 18 Vitest tests,
  and `git diff --check`.

Sprint 35 Phase 1 delivers locally:

- branded opaque string learner identifiers;
- serializable learner course, unit, lesson, metadata, activity, media, and
  answer-safe question DTOs;
- typed provider results with not-found, unavailable, invalid-data, aborted,
  and unexpected categories;
- an asynchronous `LearnerContentProvider` contract with `AbortSignal`;
- a pure static-fixture mapper and asynchronous static provider adapter;
- explicit local provider composition without runtime fallback;
- deterministic hierarchy and activity ordering;
- metadata-only practice DTOs;
- quiz DTOs that omit correctness and explanations while legacy renderers
  continue using their unchanged compatibility types;
- validated activity-scoped AI Speaking Mission mapping, including Lesson 3;
- one canonical AI mission validator shared by authoring and learner mapping;
- duplicate hierarchy-reference rejection with typed invalid-data results;
- readonly learner collections and defensively copied static-provider results;
- focused mapper, validation, and static-provider contract tests.

Sprint 35 Phase 2A delivers locally:

- learner-specific Supabase gateway and learner API service interfaces;
- one SDK-backed gateway that isolates the existing Supabase client and
  ungenerated future RPC call boundary;
- typed answer-safe catalog and lesson RPC projection contracts;
- focused runtime envelope, identifier, discriminant, ordering, and prohibited
  answer-field validation;
- normalized unavailable, not-found, invalid-response, aborted, unauthorized,
  forbidden, and unexpected infrastructure errors;
- end-to-end `AbortSignal` propagation through the SDK request builder;
- dependency-injected gateway and service tests without global SDK mocking;
- provider composition prepared for later activation (superseded by Sprint 37).

Sprint 35 Phase 2B delivers locally:

- migration 010 with learner-safe published catalog and current-lesson RPCs;
- explicit `anon`, `authenticated`, and `service_role` execute grants with
  default `PUBLIC` execution revoked;
- uniform lesson not-found behavior and complete published-parent checks;
- SQL-level quiz answer and explanation exclusion;
- pure catalog, lesson, activity, media, and metadata projection mapping;
- a dependency-injected Supabase learner provider with typed errors,
  cancellation, and defensive copies;
- explicit local and Supabase provider construction (the default changes to
  Supabase in Sprint 37);
- focused mapper, provider, composition, and SQL regression coverage.

Sprint 35 Phase 2B.1 hardens that delivery boundary with:

- an explicit SQL allow-list for every learner-visible AI mission field;
- draft-first SQL fixtures that use the publication RPC before learner reads;
- publication lifecycle, stale-version, permission, direct-access, ordering,
  schema-version, quiz-secrecy, and AI allow-list database checks;
- duplicate hierarchy and parent-identity rejection;
- provider-side PostgreSQL bigint identifier validation;
- canonical PostgreSQL UUID and timestamp validation;
- stable unsupported-schema-version error envelopes.

## Work in progress

- Execute and browser-test controlled course, unit, and lesson duplication.
- Review migration 202607220007 after its dry run and SQL review.
- Complete disposable local database execution when Docker is available.

## Pending work

- Add browser-level and disposable-database integration coverage.
- Implement learner identity and synchronized progress only in a future,
  separately designed milestone.

## Blockers

- Learner identity, enrollment, attempts, and synchronized progress do not
  exist.
- Media finalization still requires a trusted backend outside this repository.

## Next planned sprint

Complete Sprint 38 duplication browser and database QA. Server-side quiz
evaluation and scoring remains future work and is not implemented.

## Areas that must not be modified

Unless explicitly authorized:

- learner `localContentProvider` behavior;
- the external ChatGPT/Gemini copy-and-paste workflow;
- device-local learner progress semantics;
- RLS, hierarchy gates, parent scoping, versioning, or sealed content;
- applied migrations 001–008;
- unrelated routes, Lesson Studio editors, or learner activities;
- environment values, secrets, or privileged browser credentials.

## Required validation commands

```powershell
npm.cmd run build
npm.cmd run lint
npm.cmd test
git diff --check
```

Do not commit, push, or apply migrations unless explicitly requested.
## Sprint 41C — Course publication

In progress. The Studio now has the foundation for a course-level publication action, aggregated validation feedback, draft-version selection, and published-with-private-changes semantics. Remote migrations and browser release validation remain pending.

## Sprint 42A — Teacher Dashboard Foundation

In progress on the teacher-publishing branch. The `/admin` dashboard now presents role-aware Teacher Workspace and Platform Admin language, My Courses navigation, truthful future workspace placeholders, and migration-free compatibility handling for an undeployed course-publication RPC.

## Sprint 42B — Course Workspace

In progress. Course pages now provide Overview and Curriculum tabs at the existing course route, with permission-aware workspace actions and truthful future classroom placeholders. No migration or backend schema change was required.

## Sprint 43A — Classroom Architecture & UX Design

Design phase only. The Course/Class distinction, stable published course-release recommendation, teacher-owned class boundaries, enrollment methods, future routes, permission matrix, proposed schema, and RLS expectations are documented in [Classroom Architecture](CLASSROOM_ARCHITECTURE.md) and ADRs 0007–0008. No production classroom feature, migration, RPC, or enrollment flow exists.

## Sprint 43B — Classes UI Foundation

UI foundation only. `/admin/classes` provides a truthful My Classes empty state, while `/admin/classes/new` and `/admin/classes/:classId` provide clearly unavailable shells. The sidebar now opens My Classes; no classroom data, API, migration, enrollment, or student route was added.

## Sprint 43C — Domain Layer & Backend Contracts

Internal architecture only. `src/domain` now contains shared constants, domain types, permission predicates, error classes, and future service interfaces for courses, publishing, classes, assignments, enrollment, and progress. Existing feature services remain compatible; no backend calls or schema changes were introduced.

## Sprint 43D — Frontend Integration Refactor

The existing frontend now consumes domain-owned course status, activity type, and classroom summary types where practical. Classes uses centralized permission predicates, and explicit backend-unavailable adapters provide safe future service seams without issuing requests. Behavior and routes remain unchanged.

## Sprint 44.0 — Classroom Database Blueprint

## Sprint 44A — Student View Preview

In progress. Authorized admin-area users can open published Student Preview routes from Course Workspace, Curriculum lesson actions, and Lesson Studio. Preview reuses the learner LessonPlayer and blocks learner progress, completion, scoring, XP, and AI mission mutations through an explicit runtime mode. Draft preview and unsaved local-edit handoff remain future work; no migration or backend change was made.

## Sprint 44B — Saved Draft Student Preview

In progress. Preview now resolves saved draft content first, then published content, then local learner content, and reports unavailable only when all sources fail. Source labels distinguish Draft Preview, Published Preview, and Local Content Preview. Unsaved editor changes remain outside preview; no migration or database command was used.

## Sprint 44C — Draft Activity Content Mapping

## Sprint 45 — Learn Block Editor 2.0

## Sprint 45B — Learn Media Authoring & Block Actions

In progress. Persistent Learn block duplication, populated-block confirmation, and explicit media configured/missing states were added using existing theory-block persistence. Full image/audio upload controls and caption/label persistence remain blocked by the current media/content contract.

Frontend cleanup now persists stable Image and Audio media references through the existing theory-block contract, reloads secure previews after refresh, and renders both block types in authorized Student Preview. Preview exits preserve Course Workspace, Curriculum, or Lesson Studio origin, including the selected Studio activity. Interactive Practice creation remains visibly unavailable until pending migration `202607220008` is validated and deployed; no fallback creation path is used.

Release-blocker hardening makes Learn Audio reload use the same stable media-row resolution path as Image while preserving its label and transcript. Student Preview now settles every resource request into ready or a terminal failure state, supports retry and safe return actions, and renders block-local media fallbacks instead of rejecting an otherwise usable lesson.

## Sprint 45D — Learn Block UX Polish

Implemented locally as a frontend-only increment. Learn blocks support authoritative duplication, accessible confirmed deletion, native drag ordering, keyboard Move Up/Move Down controls, reorder announcements, focus recovery, improved collapsed summaries, and Collapse All/Expand All. Student Preview provides local Desktop, Tablet, and Phone widths without changing learner state or return navigation. Learn also offers an optional responsive split layout that uses the real learner renderer and explicitly shows only the last saved content. Browser QA remains pending.

## Sprint 45E — Phone Preview and Shared Workspace Controls

Implemented locally as a frontend-only increment. Forced teacher-preview modes now control both preview width and the shared learner shell: Phone and Tablet use compact activity navigation with a full-width content column, while Desktop retains the outline sidebar and learner routes remain automatic. Lesson Studio now owns the shared Editor only/Split preview and Collapse All/Expand All toolbar. Split preview loads saved activity data into `ActivityRenderer`; Interactive Practice remains explicitly unavailable. Complete activity editors have independent, local-only collapse state. Browser QA remains pending.

## Sprint 45F — Shared Collapsible Sections

Implemented locally as a frontend-only increment. Listening, Pronunciation, Quiz, legacy Practice, and AI Speaking Mission now register the shared section-collapse controller used by Learn. Individual section toggles preserve mounted form state, collapsed summaries expose content and validation status, and shared Collapse All/Expand All actions announce accurate section counts. Activity-level collapse remains separate, and Interactive Practice is unchanged. Browser QA remains pending.

## Sprint 46A — Teacher Media Library UI Foundation

Implemented locally as a frontend-only foundation. Authorized staff receive a lazy `/admin/media` route, role-aware navigation, URL-backed filters, reusable media cards, and a shared Media Picker available beside existing Learn, Listening, and Pronunciation direct uploads. The active service adapter is intentionally unavailable and never returns fake production assets or mutation success. Ownership, usage counts, listing, selection, replacement, and deletion remain pending backend work. Browser QA remains pending.

## Sprint 46B — Existing Media Assets Integration

Implemented locally without backend changes. The Media Library reads RLS-visible rows from `media_assets`, supports server-side kind/search/sort queries, and resolves Storage previews per card. Media Picker returns stable ID-and-kind selections to Learn, Listening, and Pronunciation; existing persistence regenerates secure previews after reload and Student Preview uses the same saved references. The current RLS policy exposes a shared content-manager pool rather than teacher-owned media. Replacement, deletion, usage counts, and shared upload remain unavailable. Browser QA remains pending.

In progress. Added a centralized Learn block registry, block validation helpers, reorder utilities, and collapsible block editing groundwork. Existing persistence and routes remain unchanged; richer media controls and drag-and-drop remain follow-up work.

In progress. Draft preview now uses a centralized mapper for specialist activity configuration and stable activity identity, including theory, listening, pronunciation, quiz, legacy practice, and AI Speaking Mission data. No learner projection, migration, or persistence behavior changed.

Design package only. `CLASSROOM_DATABASE_BLUEPRINT.md` specifies the future classroom tables, RLS, RPC boundaries, migration dependency graph, validation rules, integrations, and sequence diagrams. No SQL, migration, schema change, or database execution was performed.
