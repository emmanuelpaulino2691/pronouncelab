# ADR 0014: Relational Class Release Authorization

## Status

Accepted and implemented.

## Decision

A Class assignment is an append-only lifecycle record pinned to one immutable Course Release. A Class may assign multiple source Courses, but a partial unique constraint permits only one active Release for each Class/source Course. Updating a Class to a newer Release atomically deactivates the prior row and inserts a new row, preserving assignment history and Release progress.

Learner Release access is derived at request time from an active learner enrollment, active Class, and active assignment. No learner entitlement rows are copied when assignments or enrollments change. Multiple valid Classes combine with OR semantics, so removing one relationship does not revoke access supplied by another.

Teachers select only Releases they own and manage only assignments for Classes they own. Admin support is explicit. Reporting is available only through an assignment-scoped security-definer RPC that validates Class ownership and aggregates active roster progress from the assigned Release; Teachers retain no direct access to learner Release-progress tables.

## Consequences

Enrollment removal, Class archival, and assignment deactivation revoke derived access immediately without cleanup jobs or progress deletion. Publishing a newer Release never changes an assignment. Direct server-managed entitlements remain available for future legitimate non-Class delivery, but browser roles cannot create them and local bootstrap deliberately exercises Class-derived access.
