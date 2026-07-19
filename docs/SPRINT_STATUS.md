# Sprint Status

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

**Sprint 35 — Published Supabase Content Delivery Foundation.**

Status: Blueprint and ADR 0006 are complete. Phase 1 learner contracts,
mapping foundations, asynchronous provider interface, and static provider
compatibility are implemented locally. Migration 010 and Supabase delivery
implementation have not started. Migration 009 remains applied only to the
disposable local Supabase database; remote review and application remain
pending.

## Sprint objective

Establish the architecture for learner-safe published catalog and current
lesson-version delivery through narrow RPC projections, stable DTOs, an
asynchronous provider boundary, explicit route states, and non-destructive
local progress compatibility.

## Last completed sprint

**Sprint 34 — AI Speaking Mission Hardening.**

Sprint 34 implementation, application validation, and disposable
local-database validation are complete. Migration 009 remains unapplied
remotely.

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

## Work in progress

- Review Sprint 35 Phase 1 implementation and validation.
- Prepare Phase 2 learner delivery RPC migration work after authorization.

## Pending work

- Apply migration 009 only after explicit authorization.
- Create and locally validate forward-only migration 010.
- Implement the Supabase learner provider after the RPC contract exists.
- Convert learner routes to asynchronous loading in a later Sprint 35 phase.
- Implement non-destructive local progress compatibility.
- Add browser-level and disposable-database integration coverage.
- Implement learner identity and synchronized progress only in a future,
  separately designed milestone.

## Blockers

- Admin-authored Supabase content is not connected to learner routes.
- Learner identity, enrollment, attempts, and synchronized progress do not
  exist.
- Media finalization still requires a trusted backend outside this repository.

## Next planned sprint

Sprint 35 implementation follows the approved
[Sprint 35 Blueprint](SPRINT_35_BLUEPRINT.md). Sprint 36 is expected to own
server-side quiz evaluation and scoring; it is not implemented or fully
specified yet.

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
