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

**Dependencies still open:** publication completeness, full JSON validation, optimistic mission concurrency, multi-mission learner association, and stricter parser ambiguity handling. See [AI Mission known limitations](AI_SPEAKING_MISSION.md#known-limitations).

**User value:** teachers can author a repeatable speaking challenge; learners can receive external voice feedback without sharing platform credentials or requiring native integration.

### Sprint 33 — Student Experience

**Status:** Implemented for static lessons.

**Goal:** Turn the long lesson renderer into a guided, mobile-first journey.

**Delivered:** one-primary-activity navigation, explicit local completion, progress/time estimates, deterministic transitions, AI milestone, error boundary, review/restart, completion screen, and validated localStorage restoration.

**User value:** lessons feel focused and resumable without pretending server progress exists.

## Current milestone

The current milestone is **foundation hardening and convergence**:

- resolve the known AI Mission integrity/parser/concurrency gaps;
- add automated unit coverage for pure utilities and SQL execution validation;
- design the migration from static learner content to published Supabase projections;
- preserve learner route compatibility during that transition.

This milestone should precede analytics or commercial features because those systems need reliable content identity and learner identity.

## Future milestones

### Published content delivery

**Goal:** Serve learner routes from safe published Supabase projections.

**Reason:** Admin-authored content currently does not reach students.

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
