# ADR 0001: Version Lesson Content

- **Status:** Accepted
- **Date:** 2026-07-17

## Context

Teachers need to improve lesson content without changing what learners already receive mid-release. Activities have nested subtype rows, so a lesson-level edit-in-place model would make consistent publication and rollback difficult.

## Decision

Keep stable catalog identity in `lessons` and store release content in `lesson_versions`. Activities and all subtype content belong beneath a version. A lesson points to its current published version, and the database permits at most one published version per lesson.

Draft versions are editable. Published and archived version trees are sealed.

## Consequences

- New work can proceed without mutating released content.
- Publication has a single hierarchy root and audit point.
- All descendant ownership resolution and locking must reach the version.
- A new draft version is required for post-publication changes.
- Learner delivery must select `current_published_version_id` when Supabase content is integrated.

## Alternatives considered

- **Edit lessons in place:** simpler schema, but releases can change during use and nested consistency is weak.
- **Version every individual row independently:** more flexible but substantially more complex ordering and projection.
- **Store a complete lesson JSON snapshot:** atomic but weak relational integrity, media references, and quiz authoring queries.

## Future implications

Published learner DTOs should be projected from one version without exposing draft or answer-key data. A version comparison or copy-forward workflow can be added without changing the stable lesson identity.
