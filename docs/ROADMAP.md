# Roadmap

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
