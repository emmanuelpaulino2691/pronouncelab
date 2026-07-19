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

**Sprint 34 — AI Speaking Mission Hardening.**

Status: implementation and application validation are complete. Migration 009
is intentionally unapplied; disposable-database execution is blocked because
the local Docker/Supabase runtime is unavailable.

## Sprint objective

Strengthen the existing Sprint 32 AI Speaking Mission system by fixing activity
association, configuration integrity, optimistic concurrency, publication
validation, parser ambiguity, and focused automated coverage without adding a
native AI integration.

## Last completed sprint

**Sprint 33 — Student Experience.**

Sprint 33 remains implemented for static learner lessons with guided
activity-by-activity navigation and device-local progress.

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

## Work in progress

- Review migration 009 against a disposable local Supabase database when that
  environment is available.
- Manually verify the Lesson Studio conflict experience with two authenticated
  editor sessions.
- Review the migration before any authorized remote application.

## Pending work

- Apply migration 009 only after explicit authorization.
- Design safe published Supabase learner DTOs and provider convergence.
- Add browser-level and disposable-database integration coverage.
- Implement learner identity and synchronized progress only in a future,
  separately designed milestone.

## Blockers

- Admin-authored Supabase content is not connected to learner routes.
- The disposable local Supabase stack cannot run because its Docker engine is
  unavailable, so migration 009 and its database scenarios still require
  execution in a disposable environment.
- Learner identity, enrollment, attempts, and synchronized progress do not
  exist.
- Media finalization still requires a trusted backend outside this repository.

## Next planned sprint

No next numbered sprint is assigned. The next roadmap milestone is published
content delivery design through the existing content-provider abstraction.

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
