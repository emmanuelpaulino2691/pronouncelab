# ADR 0002: Separate Mutable Drafts from Sealed Content

- **Status:** Accepted
- **Date:** 2026-07-17

## Context

Role checks alone do not prevent accidental edits to released content, direct browser calls, nested reparenting, or publication races. Content and media need lifecycle guarantees at the database boundary.

## Decision

Use explicit lifecycle enums. Permit ordinary authoring only in a complete draft hierarchy. Seal published and archived lesson-version descendants with RLS, parent-immutability triggers, hierarchy locks, and lifecycle triggers. Use controlled publication functions instead of direct status updates.

## Consequences

- UI read-only behavior matches a database-enforced boundary.
- Publication and authoring serialize on the same advisory gate.
- Parent movement and descendant writes cannot independently commit using stale ownership.
- Status changes require purpose-built workflows and server-controlled audit fields.
- More SQL coordination is necessary than policy-only CRUD.

## Alternatives considered

- **UI-only disabling:** improves usability but is bypassable.
- **RLS-only lifecycle predicates:** cannot compare old/new parents safely or coordinate multi-row races by itself.
- **Allow edits and copy on read:** makes released content unstable and auditing unclear.

## Future implications

Any new subtype must join immutability, hierarchy resolution, publication completeness, and duplication logic. A later unpublished/revision workflow should retain the same sealed-release principle.
