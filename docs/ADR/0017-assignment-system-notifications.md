# ADR 0017: Assignment system notifications

## Status

Accepted for Sprint 53B.

## Decision

Assignment lifecycle notifications are durable, learner-owned rows in
`learner_notifications`, distinct from future Class announcements and direct
messages. Trusted database functions create New Assignment events, while an
idempotent timestamped processor creates Available, Due Soon (24 hours), and
Late events. `(learner_user_id, event_key)` is the deduplication contract.

The processor is scheduled by local/managed `pg_cron` every 15 minutes and can
be tested with an explicit timestamp. Learners can only read and mark their own
rows. Email, push, chat, and browser-only notification writes are out of scope.

Stale notifications remain history when assignments are updated or deactivated;
their action links still pass normal assignment authorization.

Read notifications can be soft-dismissed individually or in bulk. The inbox
also hides read rows older than 90 days. Dismissal never deletes the event row,
so event-key deduplication remains intact.
