# ADR 0013: Immutable Course Releases and Release Progress

## Status

Accepted and implemented locally.

## Decision

Each successful Course publication atomically fingerprints learner-significant Course metadata, ordered published Units, ordered published Lessons, and exact immutable Lesson-version IDs. Changed state creates an immutable numbered Release; unchanged state reuses the existing Release.

Release learning uses separate progress keyed by `course_release_lesson_id`. Public/current Sprint 52A progress remains unchanged and is never backfilled. Progress is independent between Releases, even when they reference the same Lesson version. Historical delivery resolves the manifest version, never `current_published_version_id`.

Learners normally receive Release access through an active enrollment in an active Class with an active assignment. The server-managed direct entitlement table remains a restricted non-Class authorization seam and has no browser mutation grants; bootstrap does not use it. Owners and Admins may inspect manifests but cannot write learner progress.

## Consequences

Version 1 completion never completes Version 2. Historical structure remains stable. Class assignments authorize Releases without redesigning progress identity. Duplicate practice across Releases is accepted for unambiguous behavior.
