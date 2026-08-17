# ADR 0005: Guided One-Activity Lesson Experience

- **Status:** Accepted
- **Date:** 2026-07-17

## Context

The original Lesson Player rendered activities as a long sequence. Learners needed clearer focus, progress, completion, and mobile navigation. There was no secure server progress model, and interactive components should not reset when revisited.

## Decision

Show one primary activity at a time while keeping all activity renderer instances mounted and hiding inactive ones. Require explicit completion, show deterministic transitions, and persist normalized lesson state in device-local storage. Provide review and confirmed restart behavior.

## Consequences

- Learners receive a guided flow without a second renderer architecture.
- Quiz/local component state survives backward navigation.
- Hidden mounted activities consume more DOM than true unmounting.
- Completion is truthful but device-local and unsynchronized.
- Refresh restores position; malformed state is discarded or normalized.

## Alternatives considered

- **Guided vertical page:** smaller change but weaker focus and mobile progression.
- **Unmount inactive activities:** simpler DOM but resets local interaction state.
- **Server progress immediately:** lacked learner identity, enrollment, and RLS foundations.
- **URL per activity:** improves shareability but adds route/history complexity not needed for the current static lessons.

## Future implications

The lesson-state interface can later be backed by account progress. Stable published activity identity and conflict semantics are prerequisites. Device-local state should be migrated explicitly, not presented as synchronized retroactively.
