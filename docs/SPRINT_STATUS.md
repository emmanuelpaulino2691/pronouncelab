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

**Sprint 36 — Studio authoring improvements.**

Status: In progress. The first increment finalizes the Course Editor address
workflow. New course addresses are generated automatically from the title,
teachers can explicitly switch to manual editing, and **Use title** restores
automatic generation. Existing course addresses remain unchanged unless a
teacher deliberately edits or regenerates them. Sprint 36 is not complete.

The second increment adds optional Spanish workflow instructions to AI Speaking
Missions. English remains the default, the generated AI prompt stays separate,
and existing missions without Spanish text remain valid. This does not add
platform-wide localization. Sprint 36 remains in progress.

The third increment adds teacher-managed MP3 upload, replacement, removal, and
preview to Listening authoring, together with a clearer manual transcript
editor and an accessible learner transcript disclosure. Automatic
transcription is not implemented. Sprint 36 remains in progress.

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
provider are implemented locally but remain inactive. Local Docker validation
is pending because Docker Desktop is unavailable. Phase 2B.1 security and
contract hardening is complete at the application/static-review level.
Migrations through 202607220004 are applied remotely.

## Sprint objective

Improve Studio authoring through small, contract-preserving increments. The
current increment makes course addresses predictable without changing course
routes, persistence, or the learner content-source boundary.

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
- inactive infrastructure composition while the static provider remains the
  sole active learner content provider.

Sprint 35 Phase 2B delivers locally:

- migration 010 with learner-safe published catalog and current-lesson RPCs;
- explicit `anon`, `authenticated`, and `service_role` execute grants with
  default `PUBLIC` execution revoked;
- uniform lesson not-found behavior and complete published-parent checks;
- SQL-level quiz answer and explanation exclusion;
- pure catalog, lesson, activity, media, and metadata projection mapping;
- a dependency-injected Supabase learner provider with typed errors,
  cancellation, and defensive copies;
- explicit local and Supabase provider construction while local remains the
  application default;
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

- Continue Sprint 36 Studio authoring improvements after the course address
  increment is reviewed.
- Complete browser and disposable-database verification for Sprint 36 media
  authoring and publication validation.
- Review Sprint 35 Phase 2B.1 hardening and application validation.
- Complete disposable local database execution when Docker is available.

## Pending work

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

Continue Sprint 36 through separately reviewed Studio increments. Server-side
quiz evaluation and scoring remains future work and is not implemented or
fully specified.

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
