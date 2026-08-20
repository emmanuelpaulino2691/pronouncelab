# ADR 0018: Class announcements

## Status

Accepted for Sprint 53C.

## Decision

Class announcements are a separate Teacher-to-Class communication domain.
`class_announcements` stores one Class-scoped message, while
`class_announcement_reads` stores durable learner-specific read state by
announcement revision. A published announcement creates one lightweight
`new_announcement` system notification per active learner; meaningful edits
advance the revision and create `announcement_updated` events. All events use
learner/event-key deduplication, and late enrollment backfills at most 20
non-withdrawn announcements from the previous 90 days.

Editing preserves identity and publication time while making the latest revision
unread for learners who read an older revision. Withdrawal is soft-retained but
is a learner-visible deletion: normal announcement and notification projections
exclude the announcement and every related event, including retained body/title
metadata. Direct messages, replies, attachments, and scheduled announcements
remain future domains.
