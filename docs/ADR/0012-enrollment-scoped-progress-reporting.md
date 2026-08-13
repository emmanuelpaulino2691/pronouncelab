# ADR 0012: Enrollment-Scoped Progress Reporting

## Status

Accepted and implemented by Sprint 52B.

## Context

Learner progress is private and its base tables must not become generally readable by Teachers. Classes provide the first explicit Teacher-to-Learner authorization relationship, while Course release assignments are not implemented yet.

## Decision

Teachers receive no direct progress-table access. A security-definer reporting RPC verifies Class ownership and active enrollment before returning coarse learner-wide started/completed counts and last activity time. Removed enrollments disappear immediately. Detailed, Course-scoped reporting waits for immutable release assignments.

## Consequences

Enrollment authorizes only the dedicated summary contract, never arbitrary learner records. Sprint 52C must add release-scoped assignments before detailed Lesson reporting; the temporary learner-wide summary is labelled honestly in the UI.
