# ADR 0007: Stable Course Releases for Class Assignments

## Status

Accepted — design decision; not implemented.

## Context

Courses are reusable content and lesson versions are individually published. A class needs a stable representation of the published course state it is teaching. Automatically following the latest course publication would silently change active learning and make progress reporting ambiguous.

## Decision

Introduce a future immutable `course_releases` record that references the complete active published lesson-version set. Class-course assignments reference a release. A later course publication creates a new release; teachers explicitly review and update each class assignment.

## Consequences

Students receive stable content, progress can retain release context, and rollback is explicit. The design requires a release-building step and new database/RLS work. The current publication system is not changed by this ADR.
