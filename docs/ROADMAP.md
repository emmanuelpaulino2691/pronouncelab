# Roadmap

## Sprint 52A — Learner Identity and Synced Progress Foundation

Implemented locally. Ordinary authenticated users are learners, published activity completion is recorded idempotently through learner-scoped RPCs, and local progress merges monotonically with server snapshots for offline resilience and cross-device continuity. Sequential locks and Continue Learning consume the merged snapshot. Student Preview and staff identities cannot create learner progress.

Sprint 52B implements teacher-owned Classes, secure join-code enrollment, learner memberships, soft removal/rejoin, and enrollment-scoped coarse progress reporting. Sprint 52C should introduce immutable Course releases and Class assignments before detailed progress reporting.
Sprint 52C provides immutable Course Releases, historical exact-version delivery, independent Release progress, Class-to-Release assignments, enrollment-derived authorization, and assignment-scoped Teacher reporting. Future work can add due dates, assignment-specific learner launches, and richer reporting history without changing Release identity.

## Sprint 51C — Media Library Content Deduplication

Implemented locally. Trusted owner-scoped SHA-256 registration prevents future
duplicate logical audio/image assets, removes duplicate uploaded objects, and
reuses stable published media. Existing historical duplicates are intentionally
not consolidated. Future work may add an audited usage-count view and explicit
orphan-asset cleanup after published-reference retention rules are defined.

## Sprint 51B — Learner Progression and Controlled Draft Cleanup

Implemented locally. Sequential device-local lesson and unit unlocking, complete
learner lists, Learn audio transcripts, draft-only publication feedback, and
controlled draft deletion complete the progressive-authoring follow-up.

Future progression work should replace device-local completion with an
authenticated, synchronized event model before assignments or cross-device
learning paths depend on these locks.

## Sprint 51A — Progressive Course Authoring

Implemented locally. Published courses and units grow through append-only draft
descendants while released siblings remain immutable. Controlled mid-list
structural reorder remains future work.

## Sprint 49D — Course Experience

Implemented locally as a frontend-only learner journey refinement. Courses, Course detail, and Unit detail share the Home recommendation engine and device-local progress. Sprint 51B subsequently adds simple sequential Unit/Lesson locks and keeps the current item in each complete list.

Future value depends on the separately proposed authored `lessonPurpose`, learner identity and synchronized progress, real pedagogical sequencing rules if locking is ever introduced, and browser-level responsive journey QA.

## Sprint 49B — Next-Action Student Dashboard

Implemented locally as a frontend-only learner increment. Dashboard now leads with a deterministic Start, Continue, or Review action derived from published usable lessons and validated device-local progress. It shows course and unit context, accessible device-local lesson/course completion, stable loading/error/empty states, and subordinate non-numeric future motivation placeholders. Timestamp-based recent activity remains omitted.

Future dependencies remain learner identity, synchronized and timestamped progress events, Classes enrollment and assignments, teacher-feedback visibility, and durable daily-goal, streak, XP, and achievement rules.

## Sprint 49A — Student Experience Architecture

Implemented locally as a frontend architecture increment. The canonical learner journey now defines Dashboard, Courses, Current Course, Current Unit, Lesson, Lesson Complete, and future Progress, Achievements, Profile, Settings, Classes, and Assignments. Current Course uses existing device-local completed lesson IDs to show unit progress and recommend the first incomplete unit. Unsupported motivation systems are explicitly placeholder-only.

Before Classes backend implementation:

1. reconcile learner identity, local-data migration, and account/session behavior;
2. define synchronized progress events, idempotency, offline reconciliation, and privacy controls;
3. define stable published course releases for class assignment;
4. approve enrollment, assignment, teacher-feedback, and learner-visibility contracts;
5. design Progress, Profile, and Settings route states against those contracts;
6. define daily goal, streak, XP, and achievement rules only after durable event semantics exist;
7. add browser-level responsive and accessibility coverage for the current learner journey.

## Sprint 48D — Performance and Bundle Optimization

Implemented locally. Route and activity-editor lazy boundaries now isolate Supabase and activity-specific authoring code from the main entry path. Future performance work should be driven by production telemetry; possible follow-ups include browser-level chunk failure tests, navigation prefetching for high-frequency routes, and further learner renderer splitting only if shared-renderer growth becomes material.

### Sprint 48A — Global Search & Command Palette Foundation

**Delivered locally:** lazy global admin Command Palette, typed registry, stable ranked matching, route-context and template commands, client-side navigation, truthful unavailable commands, keyboard/mouse interaction, responsive presentation, and safe twenty-item browser history.

**Future:** page-provided course hierarchy/media command contributions, command favorites, authorized mutation commands, and optional synchronized history. Backend search is not implemented.

### Sprint 47B — Smart Content Builder Foundation

**Delivered locally:** reusable activity-template registry, preview-first Smart Builder, local favorites and ten-item recents, intelligent empty-lesson entry points, and validated non-mutating Duplicate/Copy Activity workflows.

**Future backend integration:** atomic activity duplication with destination position, cross-lesson copy with parent validation and title rules, and an explicit template-instantiation contract. Browser preference synchronization is not implemented.

### Sprint 47A — Bulk Authoring & Content Operations Foundation

**Delivered locally:** reusable quick actions and dialogs, future request contracts, validated destination workflows, publication badge semantics, and non-mutating drag/keyboard reorder affordances.

**Future backend integration:** atomic destination-aware unit duplication, cross-unit lesson copy/move, archive, and bulk reorder with parent scope, hierarchy locking, RLS, and transaction-safe ordering.

## Contents

- [Status language](#status-language)
- [Completed foundation](#completed-foundation)
- [Current milestone](#current-milestone)
- [Future milestones](#future-milestones)

## Status language

- **Implemented** means code exists in this repository.
- **Partial** means a useful slice exists but a named dependency or hardening task remains.
- **Future** means no complete production implementation exists.

## Completed foundation

Before the numbered visual/product sprints, the repository established Supabase schema/RLS/storage, secure publication hardening, admin course/unit/lesson CRUD, staff authentication, and Lesson Studio authoring.

### Sprint 31 — Visual Foundation and Admin Dashboard

**Status:** Implemented.

**Goal:** Make the Content Studio visibly cohesive and useful at `/admin`.

**Delivered:** tokenized admin visual foundation, responsive sidebar/layout, real RLS-visible dashboard statistics, improved course/unit/lesson pages, polished Studio shell, and lazy routes.

**User value:** staff can understand content status and navigate authoring with a professional, permission-aware interface.

### Sprint 32 — AI Speaking Mission MVP

**Status:** Partial/implemented MVP.

**Goal:** Add a structured final speaking challenge using external AI tools without an AI API.

**Delivered:** new activity type/table, dedicated create/duplicate RPCs, structured Studio editor, deterministic prompt generator, learner copy/paste card, result parser and local confirmation.

**Dependencies addressed by Sprint 34:** publication completeness, full JSON validation, optimistic mission concurrency, multi-mission learner association, and stricter parser ambiguity handling.

**User value:** teachers can author a repeatable speaking challenge; learners can receive external voice feedback without sharing platform credentials or requiring native integration.

### Sprint 33 — Student Experience

**Status:** Implemented for static lessons.

**Goal:** Turn the long lesson renderer into a guided, mobile-first journey.

**Delivered:** one-primary-activity navigation, explicit local completion, progress/time estimates, deterministic transitions, AI milestone, error boundary, review/restart, completion screen, and validated localStorage restoration.

**User value:** lessons feel focused and resumable without pretending server progress exists.

### Sprint 34 — AI Speaking Mission Hardening

**Status:** Implemented; migration 009 is applied.

**Goal:** Strengthen the existing AI mission system without changing its external ChatGPT/Gemini workflow.

**Delivered:** activity-scoped learner missions, complete database configuration validation, guarded atomic creation, optimistic-concurrency save RPC, publication completeness checks, strict parser handling, and focused Vitest coverage.

**User value:** learners receive the correct mission when a lesson has several AI activities, while teachers receive conflict-safe authoring and publishers cannot release incomplete missions.

## Current milestone

### Sprint 45D — Learn Block UX Polish

**Status:** Implemented locally; browser QA pending.

**Delivered:** frontend-only persistent Learn duplication and deletion semantics, drag ordering with keyboard fallback, long-lesson collapse controls, Student Preview device widths, and a saved-content split preview using the shared learner renderer.

### Sprint 45E — Phone Preview and Shared Activity Workspace Controls

**Delivered locally:** forced responsive learner layouts for constrained teacher previews, shared Lesson Studio view controls, saved-content split preview across supported activity renderers, truthful section-control availability, and per-activity editor collapse. Manual browser QA remains before release sign-off.

**Boundary:** Split Preview does not inject unsaved state, responsive modes do not alter learner logic, and no schema, RPC, migration, Storage-copy, or learner-progress contract changed.

### Sprint 45F — Shared Collapsible Sections Across Activity Editors

**Status:** Implemented locally; browser QA pending.

**Delivered:** a counted shared section-controller contract, accessible mounted-content collapse surfaces, useful collapsed validation summaries, and working workspace Collapse All/Expand All behavior for Learn, Listening, Pronunciation, Quiz, legacy Practice, and AI Speaking Mission.

**Boundary:** collapse state is presentation-only, Interactive Practice is unchanged, and no learner, persistence, scoring, AI-provider, schema, RPC, or migration contract changed.

### Sprint 46A — Teacher Media Library UI Foundation

**Status:** Implemented locally; backend integration and browser QA pending.

**Delivered:** lazy Media Library route, role-aware navigation and UI permissions, schema-aligned media domain/service contracts, URL-backed filters, truthful terminal states, reusable media cards and picker, and picker entry points beside supported direct-upload controls.

**Boundary:** the adapter is intentionally unavailable. No production list, selection, upload, replacement, deletion, ownership, usage-count, schema, Storage, RLS, RPC, or migration behavior changed.

### Sprint 46B — Connect Teacher Media Library to Existing Assets

**Status:** Implemented locally; browser QA pending.

**Delivered:** direct RLS-backed `media_assets` listing, server-side filters and sorting, isolated secure preview resolution, stable ID-only Media Picker selection, and shared asset reuse across Learn, Listening, and Pronunciation authoring.

**Boundary:** current media visibility remains the existing shared content-manager RLS pool. Shared upload, ownership, usage counting, replacement, and deletion remain future backend work; no schema, RPC, policy, Storage configuration, or migration changed.

### Sprint 41 — Publishing and Versioning Experience

**Status:** Partial; implemented locally, with specialist-RPC hardening and
course-wide publication validation still future work.

**Delivered locally:** Published Lesson Studio versions are read-only, a new
draft can be created from the current published version, copied activity trees
open automatically, and the existing controlled publication path remains
available.

**Boundary:** Published learner content remains active while a new draft is
edited. A consolidated course publication report and all-lesson atomic release
remain future work until every specialist mutation RPC supports drafts beneath
published parent metadata.

### Sprint 40 — Teacher Ownership Foundation

**Status:** Implemented locally; migration execution and browser QA are
pending.

**Delivered locally:** A first-class `teacher` role, immutable course-root
ownership, deterministic backfill for existing courses, owner-derived
hierarchy RLS, ownership enforcement inside controlled mutations, teacher
publication checks, and owner-scoped **My Courses** presentation.

**Compatibility:** Administrators retain global authority, publishers retain
cross-course read/publication authority, and legacy editors retain
owner-scoped draft editing. Published learner RPCs, anonymous learner routes,
and device-local progress are unchanged.

**Boundary:** Classes, enrollment, student accounts, sharing, assignments,
analytics, and Interactive Practice learner delivery remain future work.

### Sprint 39A — Interactive Practice Foundation

**Status:** Implemented locally; migration deployment and browser QA are
pending.

**Delivered locally:** A new `interactive_practice` draft activity, a focused
Studio editor for Multiple Choice, True / False, Match, and Fill in the Blank,
optimistic-concurrency saving, controlled create and duplicate operations, and
publication completeness validation.

**Security boundary:** Answer keys, accepted answers, matching data, and
private explanations are stored behind staff-only RLS. Learner RPCs and
published projections are unchanged, so Sprint 39A does not deliver this
content to learner clients.

**Boundary:** Existing `practice` and `quiz` activities are not migrated,
renamed, removed, or changed. Learner rendering, answer checking, and scoring
remain future work for Sprint 39B or later. Publication validates completeness
but does not release Interactive Practice content until that answer-safe learner
delivery contract exists.

### Sprint 38 — Teacher Experience

**Status:** In progress.

**Delivered locally:** Controlled same-parent duplication for draft courses,
units, and lessons. Each operation runs atomically behind the hierarchy gate,
creates new draft identities, preserves ordered subtype content and media
references, and excludes published versions. Teacher-facing actions expose
pending and retry states, lessons open the duplicated Studio immediately, and
copy names increment predictably. Lesson Studio also supports Ctrl+S or
Command+S for the focused editor form.

**Boundary:** No new activity types, templates, libraries, universal blocks,
published-history cloning, or storage-object copying are introduced.

**Remaining work:** Execute the pending migration in a disposable database and
complete browser QA for deep-copy content, keyboard save, long-operation
feedback, permissions, and retry behavior.

### Sprint 37 — Published Content Delivery

**Status:** In progress.

**Delivered in this increment:** The learner content composition now selects
the Supabase provider. Dashboard and hierarchy routes load the published
catalog, Lesson Player loads only the current published lesson version, and
published activity DTOs render inside the existing learner shell. Continue
Learning and completion remain device-local and accept published string IDs.

**Security boundary:** Learner routes call only the answer-safe published RPCs;
draft hierarchy content, superseded versions, quiz correctness, and
explanations are excluded. A pending forward migration exposes the structured
pronunciation block fields without changing those publication gates.

**Remaining work:** browser QA against representative published content and
deployment of the reviewed forward migration. Server-side assessment scoring,
synchronized progress, enrollment, and learner accounts remain future work.

The current milestone remains **foundation hardening and convergence**:

- validate new forward migrations through the authorized workflow before deployment;
- expand database execution validation beyond focused pure utility tests;
- design the migration from static learner content to published Supabase projections;
- preserve learner route compatibility during that transition.

This milestone should precede analytics or commercial features because those systems need reliable content identity and learner identity.

### Sprint 36 — Studio Authoring Improvements

**Status:** In progress.

**Current increment:** The Course Editor generates a safe course address from
the title by default, provides an explicit manual-editing mode, allows teachers
to return to title-based generation, and preserves existing course URLs unless
the teacher deliberately changes them.

**Boundary:** This increment does not change learner routes, course persistence
contracts, publication behavior, or the static/Supabase content-source split.

**Second increment:** AI Speaking Missions support optional Spanish student
workflow instructions while keeping English as the default and the generated
AI prompt unchanged. The feature is deliberately mission-specific and does not
introduce language detection, translation, or application-wide localization.

**Third increment:** Listening authoring supports MP3 upload, replacement,
removal, draft preview, and manual transcripts. Learners receive native audio
controls and an optional transcript hidden by default. Automatic transcription,
captions, timestamps, highlighting, and advanced playback remain future work.

**Release hardening:** Course creation waits for authoritative course ordering
before mounting the form, and background admin-access rechecks preserve the
current Lesson Studio activity while access remains valid.

**Fourth increment:** Pronunciation activities support production-oriented
Word List and Minimal Pairs blocks with inline editing, multi-line paste,
keyboard-accessible ordering, optional managed audio, responsive learner
presentation, and publication completeness checks. The data remains within
the pronunciation subtype so this increment can validate the authoring model
without prematurely introducing a generic block framework. Convergence into a
Universal Block System remains future work and must preserve these structured
entries and existing legacy pronunciation items.

### Sprint 35 — Published Supabase Content Delivery Foundation

**Status:** Blueprint complete; implementation not started.

**Goal:** Establish learner-safe published catalog and current-version lesson
delivery through versioned RPC projections, typed DTOs, an asynchronous
Supabase content provider, explicit route states, and non-destructive local
progress compatibility.

**Boundary:** Sprint 35 does not implement server-side quiz scoring, learner
authentication, synchronized progress, analytics, enrollment, payments, media
management, or AI history.

**Specification:** See [Sprint 35 Blueprint](SPRINT_35_BLUEPRINT.md) and
[ADR 0006](ADR/0006-published-supabase-content-delivery.md).

## Future milestones

### Published content delivery

**Status:** Implemented locally in Sprint 37; deployment and browser QA remain.

**Goal:** Serve learner routes from safe published Supabase projections.

**Reason:** Teachers need reviewed published content to reach students without a code deployment.

**Dependencies:** stable learner DTOs, public answer-safe RPCs for all activities, media URLs, migration of static IDs/fixtures, caching/error strategy.

**Expected user value:** teachers publish once and learners receive reviewed content without code deployments.

### AI Progress Journal

**Goal:** Persist explicitly confirmed AI mission results as learner history.

**Reason:** Current result preview disappears with component state.

**Dependencies:** learner identity, consent/retention policy, attempts schema, RLS, provider/version fields, deletion/export semantics.

**Expected user value:** learners revisit difficult words, strengths, and next goals over time.

### Teacher Analytics

**Goal:** Show teachers aggregate curriculum participation and learning signals.

**Reason:** Teachers need evidence to improve content and support learners.

**Dependencies:** synchronized progress/attempts, cohort or enrollment model, privacy thresholds, truthful event definitions.

**Expected user value:** identify lesson friction and learners needing support.

### Gamification

**Goal:** Add motivating progression based on verified learning actions.

**Reason:** Device-local dashboard statistics are not adequate for durable rewards.

**Dependencies:** account progress, idempotent events, anti-duplication rules, product/teaching review.

**Expected user value:** encourage consistent practice without fake scores or childish mechanics.

### Placement Test

**Goal:** Recommend an appropriate entry point.

**Reason:** Learners arrive with different listening and pronunciation foundations.

**Dependencies:** validated assessment design, answer security, attempt persistence, scoring interpretation, accessibility.

**Expected user value:** less repetition and a clearer learning path.

### CEFR Dashboard

**Goal:** Summarize verified curriculum coverage and learner advancement by CEFR level.

**Reason:** CEFR exists in mission/course metadata but is not a progress model.

**Dependencies:** normalized objectives, account progress, placement/assessment validity.

**Expected user value:** understandable level-based goals and curriculum visibility.

### Pronunciation Analytics

**Goal:** Surface recurring sound/word practice needs from consented evidence.

**Reason:** A journal can become more useful when patterns are visible.

**Dependencies:** AI Journal or native assessment data, normalization, confidence labels, privacy and deletion, avoidance of overclaiming.

**Expected user value:** targeted review recommendations.

### Commercial access

**Goal:** Support sustainable paid curricula or memberships.

**Reason:** Fund ongoing content and product development.

**Dependencies:** identity, entitlements, billing provider, legal/privacy terms, customer support, robust published delivery.

**Expected user value:** dependable access to maintained curricula and future services.
## Course-wide publication

Course-wide validation and atomic publication are now part of the Studio direction. The workflow is intentionally separate from future classes, assignments, and enrollment: publishing controls learner-facing content, while those systems will later control who receives it.

## Teacher Workspace

The next workspace increment focuses on a role-aware dashboard and My Courses experience using existing ownership and permission data. Classes, Students, and Assignments remain future work and must not be represented as functional features until their data and authorization models are ready.

Course workspaces extend this direction with a stable Overview/Curriculum split. Future classroom, assignment, and analytics areas remain placeholders until their underlying product and data models are implemented.

## Sprint 43 — Classroom architecture

## Student Preview

The Studio preview foundation is implemented as a safe, published-content learner presentation. Future work may add an authorized draft adapter, save-before-preview handling, richer course navigation, and draft media resolution. Preview must continue to isolate learner progress and remain separate from public `/learn` routes.

Saved-draft preview is now the preferred source when the viewer is authorized. Published content and local learner fixtures remain explicit fallbacks, while draft media and unsaved-edit transfer remain future refinements.

The Classroom design phase defines the Course/Class distinction, teacher-owned classes, secure enrollment, stable published course releases, explicit update behavior, and future learner class navigation. Implementation is intentionally deferred until release snapshots, membership, progress, and RLS contracts are approved.

The Classes UI foundation is the first non-data increment: it establishes reusable class cards, filters, creation form states, and workspace navigation without pretending classroom functionality exists.

The next internal increment standardizes domain vocabulary and backend contracts before classroom persistence work. Implementation should reuse these contracts rather than create feature-local permission, status, or error variants.
