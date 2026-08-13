# ADR 0011: Authenticated Learners and Monotonic Progress Snapshots

- **Status:** Accepted
- **Date:** 2026-08-14

## Context

Learner navigation used anonymous published-content reads and device-local completion. That cannot provide cross-device continuity or a trustworthy future class progress source.

## Decision

An authenticated user with no staff `user_roles` row is a learner. Staff roles remain capabilities, not personas, and are never implicitly allowed to create learner progress. Future enrollment will relate learner `auth.users` identities to teacher-owned classes without changing the staff enum.

Store monotonic activity and lesson snapshots rather than an analytics event log. Trusted RPCs derive the learner from `auth.uid()`, accept only current published activity identities, and derive Lesson completion after every idempotent activity completion. Browser local state remains an offline cache and import source; merges are unions and server completion is never deleted by Restart.

## Consequences

- Cross-device completion and Continue Learning can be reconstructed without derived Course or Unit rows.
- RLS exposes only a learner's own rows, with platform-admin visibility; teachers require a future explicit enrollment policy.
- Published activity IDs, rather than client activity indexes, are the server identity boundary.
- Attempt history, scores, reset/delete semantics, enrollment, assignments, and teacher reporting remain future work.
