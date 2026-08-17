# ADR 0016: Assignment scheduling and Class timezones

## Status

Accepted locally in Sprint 53A.

## Decision

Availability and due dates are metadata on `class_course_assignments`, not on
Courses or immutable Releases. They are stored as UTC `timestamptz` values.
`NULL available_at` means available immediately. An optional due date must be
after availability (or after the current instant for an immediate assignment).

Each Class stores an IANA timezone used to present these academic dates. The
timezone is display/context metadata; it does not change stored instants.

## Authorization and lifecycle

The Release authorization predicate requires an active Class, enrollment, and
assignment and additionally requires availability to have arrived. Due dates
never revoke access: an incomplete assignment is presented as Late and remains
completable. Teacher schedule edits use an owner-checked RPC and preserve the
assignment ID, Release history, and learner progress. Updating an assignment to
a newer Release carries the existing schedule forward while the existing
stable-source progress projection runs atomically.

Notifications, grace periods, learner-specific extensions, and a full schedule
audit event stream are intentionally deferred.
