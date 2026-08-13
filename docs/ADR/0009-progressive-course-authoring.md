# ADR 0009: Progressive Course Authoring

- **Status:** Accepted
- **Date:** 2026-08-12

## Decision

Published courses may receive new draft units, and published units may receive
new draft lessons. Narrow security-definer RPCs authorize course ownership,
acquire the hierarchy gate, and append after existing siblings. Lesson creation
also creates draft Version 1 atomically.

Course-level **Publish updates** remains the atomic release transaction.
Incomplete additions stay private while existing learner content remains
available.

## Consequences

Sprint 51B clarifies two consequences of this model: Publish updates validates
only mutable draft additions/versions, and an activity inside a draft lesson
version remains deletable even when its Course, Unit, and Lesson ancestors are
published. Both operations remain hierarchy-gated and owner-scoped.

- Released siblings and historical versions remain immutable.
- Draft descendants are editable and deletable beneath published parents.
- Direct browser inserts are not a structural-creation API.
- Controlled mid-list structural reorder remains future work.
- One incomplete draft prevents other drafts in that course from publishing.
