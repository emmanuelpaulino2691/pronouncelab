# ADR 0015: Course Library visibility and progress contexts

## Status

Accepted.

## Decision

Publication validates current Course content and creates an immutable Release; it does not grant independent learner access. Every Course has a learner visibility of Class only, Unlisted, or Public, defaulting and migrating to Class only. Visibility is excluded from Release fingerprints.

Public Courses are discoverable for anonymous or authenticated independent practice. Unlisted Courses require an authenticated learner to redeem a cryptographically random, revocable link whose database representation is a SHA-256 digest. Redemption creates a learner-scoped current-Course access relationship. Class-only Courses have no current/public learner delivery; Class assignments continue to authorize exact immutable Releases.

Class assignment and Course Library journeys remain separate runtime contexts. They share presentation components but not data providers, hierarchy authority, progress identity, continuation, or Teacher reporting. Home derives continuation only from active Class assignments. Course Library derives independent resume from current/public progress.

## Consequences

- Existing Courses become Class only rather than remaining globally visible by accident.
- Changing visibility creates no Release and changes no assignment or Release progress.
- Revoking an Unlisted link prevents new redemption; regenerating or leaving Unlisted also revokes existing Unlisted access without deleting personal progress.
- An assigned Public Course may appear in both contexts, but learner copy labels Class Progress and Independent Practice separately and prioritizes the assignment.
- Anonymous users may browse Public Courses, but server-synchronized independent progress still requires a learner account.
