# ADR 0006: Published Supabase Content Delivery

- **Status:** Accepted for Sprint 35 implementation
- **Date:** 2026-07-19

## Context

PronounceLab currently has two deliberately separate content paths. Learner
routes synchronously read static TypeScript fixtures through
`localContentProvider`, while the Content Studio writes a versioned Supabase
model protected by RLS, hierarchy gates, immutable releases, and trusted RPCs.
Publishing does not yet make authored content available to learners.

This separation was appropriate while the authoring, publication, and learner
experiences were being established. It is now the principal architectural gap:
future learner identity, synchronized progress, analytics, entitlements, and
commercial access all require stable published content identity.

The authoring schema is not a learner API. Raw rows contain lifecycle, audit,
parent, and answer-key fields; subtype rows require hierarchy validation and
assembly; PostgreSQL `bigint` identifiers are unsafe as an implicit JavaScript
number contract; and learner routes currently have no asynchronous loading or
failure model.

## Decision

### Published source of truth

Supabase is the canonical source for published learner content. During the
bounded transition, the local provider remains available only through an
explicit provider selection or legacy compatibility path. A Supabase failure
must not silently substitute static fixtures.

### Learner delivery boundary

Learner content is exposed through narrow, versioned RPC projections. React
components never receive raw database rows and never assemble a lesson through
independent browser queries.

The minimum Sprint 35 read surface is:

- one coherent published catalog projection;
- one coherent complete published lesson projection.

Both functions validate the complete published hierarchy. Only a lesson's
`current_published_version_id` may be delivered.

### Visibility

Draft, unpublished, archived, incomplete, and incorrectly parented content is
invisible to learners. Published delivery does not weaken the existing sealed
release model.

### Stable DTOs

Versioned learner DTOs form the stable contract between database projections
and the UI. An explicit mapping layer validates unknown RPC payloads and
converts them into learner domain values. Database column names, lifecycle
fields, audit identities, and internal media metadata do not cross this
boundary.

### Asynchronous access

All learner content access becomes asynchronous through a formal
`LearnerContentProvider` interface. Routes provide explicit loading, empty,
not-found, unavailable, retryable-error, and stale-request behavior.

### Identifier format

The canonical learner identifier type is an opaque TypeScript `string`.
Sprint 35 Supabase RPCs serialize database `bigint` identifiers as canonical
unsigned base-10 strings. Route parameters remain strings and are never
converted with `Number`.

The string boundary permits a later UUID identifier without changing React
component contracts. Storage records additionally carry a content-source
namespace so a legacy local ID cannot be confused with the same Supabase
number.

### Progress compatibility

Existing device-local progress is preserved. A versioned progress repository
continues to read legacy numeric records and migrates them only through an
explicit local-to-Supabase lesson mapping. Migration is idempotent,
non-destructive, and version-aware.

New Supabase progress is keyed by source, lesson ID, published lesson-version
ID, and stable activity IDs. Numeric equality alone never establishes identity.
Unmapped or malformed legacy data is ignored safely but not silently deleted.

### Quiz boundary

Published lesson delivery may include learner-safe quiz titles, instructions,
question prompts, and option text. It never includes `is_correct`, a correct
option index, or pre-submission explanations.

Sprint 35 does not implement scoring. Published quizzes use a truthful
answer-safe, non-scoring learner state. Server-side answer evaluation and
attempt semantics are deferred to Sprint 36.

### Security

RLS remains defense in depth. Security-definer projections schema-qualify every
object, set `search_path = ''`, authorize visibility internally, revoke default
`PUBLIC` execution, and grant only the intended `anon` and `authenticated`
roles.

### Cache and offline compatibility

DTO envelopes include schema and publication revision metadata. Sprint 35 uses
bounded in-memory caching and request deduplication. Lesson payloads are keyed
by immutable published-version identity.

The contracts remain serializable and compatible with a future Cache Storage
or IndexedDB implementation, but Sprint 35 does not claim offline support or
persist lesson payloads locally.

## Alternatives considered

### Query published base tables directly

Rejected. Browser joins would expose the authoring schema, produce N+1
requests, duplicate hierarchy checks, and increase the risk of draft, audit,
media, or quiz-answer leakage.

### Return complete raw row graphs from one RPC

Rejected. A single call would reduce network traffic but would still couple
React to database columns and nullable authoring shapes. Stable DTO projections
and mapping are required.

### Keep static content authoritative

Rejected. It prevents Content Studio publication from reaching learners and
blocks stable downstream identity.

### Silently fall back to static fixtures

Rejected. It would hide outages and show content that may differ from the
publisher's current release. Compatibility fallback must be explicit.

### Use JavaScript numbers for Supabase IDs

Rejected. PostgreSQL `bigint` can exceed JavaScript's safe integer range, and
numeric component contracts would make future UUID adoption expensive.

### Expose quiz answers to preserve the current quiz renderer

Rejected. Answer secrecy is a database invariant. Sprint 35 accepts a
non-scoring published quiz state and defers evaluation to Sprint 36.

### Implement learner accounts and cloud progress simultaneously

Rejected. Identity, consent, enrollment, conflict, retention, and deletion
semantics are a separate milestone.

## Consequences

- Learner route pages and content services become asynchronous.
- The local provider must adapt to the same contract during transition.
- A runtime DTO validation and mapping layer becomes mandatory.
- Route parameters remain compatible in shape but cease to be numeric values
  inside the application.
- The Lesson Player and activity registry remain the only learner rendering
  system.
- Progress persistence requires a versioned compatibility layer.
- Published quizzes cannot show correctness or scores until Sprint 36.
- Delivery RPC signatures become durable application contracts requiring SQL
  execution and security tests.
- Network loading, retry, and unavailable states become normal learner states.

## Security implications

- Delivery functions must validate course, unit, lesson, current version,
  activity, subtype, assessment, and media ownership on every projection.
- Ordinary authenticated learners receive no additional authoring visibility.
- Questions and options remain answer-safe.
- Draft Storage paths, audit identities, publication tokens, and internal media
  verification data never enter learner DTOs.
- Malformed published content fails closed as unavailable content; raw SQL or
  PostgREST errors are not shown to learners.
- RLS remains enabled even though security-definer functions perform the
  projection.

## Migration implications

Sprint 35 requires a new forward-only migration after the effective migration
ledger is confirmed. The expected migration defines the two learner delivery
RPCs, their versioned return contracts, required supporting helpers, and exact
grants/revocations.

Migration 009 remains a prerequisite for the AI mission completeness guarantee
but is not applied remotely by this decision or by Blueprint preparation.
Applied migrations are not edited.

No learner identity, progress, attempt, enrollment, or analytics table is
introduced by Sprint 35.

## Future implications

- Sprint 36 can add a parent-scoped server quiz-evaluation RPC without changing
  published lesson delivery DTOs.
- Future learner authentication and entitlements can be enforced inside the
  same RPC boundary.
- Version-aware DTOs support query caching, persisted offline caches, and
  explicit invalidation.
- Stable lesson and activity identities provide the basis for synchronized
  progress and analytics.
- Future UUIDs can cross the existing string identifier boundary without a
  React-wide type migration.
