# Contributing

## Contents

- [Before you begin](#before-you-begin)
- [Change workflow](#change-workflow)
- [Coding standards](#coding-standards)
- [Review expectations](#review-expectations)
- [Testing and validation](#testing-and-validation)
- [Documentation expectations](#documentation-expectations)

## Before you begin

Read [AGENTS.md](../AGENTS.md), then the subsystem document relevant to your change. Confirm the working tree and branch before editing. Do not discard work you did not create.

No dependency installation, environment change, migration application, commit, push, merge, or branch switch is implied by a coding request.

## Change workflow

1. Trace the existing route, types, services, database boundary, and callers.
2. State a concise plan and likely files.
3. Implement the smallest complete behavior.
4. Preserve permissions, stale-request guards, parent scoping, responsive behavior, and accessibility.
5. Review the entire diff.
6. Run required validation.
7. Report exact files, behavior, limitations, and checks.

## Coding standards

- Use strict TypeScript and explicit domain types; avoid `any`.
- Reuse components and utilities.
- Keep pages/components focused; place Supabase calls in feature services.
- Use pure utilities for deterministic transformations.
- Trim and validate required input.
- Prevent double submission.
- Treat zero-row scoped writes as failures.
- Ignore stale asynchronous results after route/selection changes.
- Never allow frontend update payloads to reparent nested records.
- Render user/external text as text, never raw HTML.
- Keep learner content on `localContentProvider` until the delivery architecture changes explicitly.

### Database

- RLS is the security boundary.
- Use forward-only migrations after application.
- Security-definer functions use an empty search path and qualified objects.
- Revoke `PUBLIC`, grant narrowly, authorize internally.
- Preserve hierarchy gate ordering and sealed-content triggers.
- Use atomic RPCs for reorder, compound creation, and lifecycle transitions.

## Review expectations

Review concrete behavior, not personal style. Check:

- authorization versus UI permission;
- old/new parent and lifecycle integrity;
- direct Supabase-call bypasses;
- concurrency and command-snapshot races;
- route mismatch and stale state;
- answer/media exposure;
- loading, error, empty, read-only, and mobile states;
- migration order and effective definitions;
- changes to learner-facing behavior.

Known limitations should be recorded, but do not expand an unrelated patch solely to redesign them.

## Testing and validation

Required:

```powershell
npm.cmd run build
npm.cmd run lint
npm.cmd test
git diff --check
```

`npm.cmd test` runs focused Vitest utility tests. Browser and database integration coverage remain future work.

Database changes should also receive dry-run/ledger checks and, ideally, full execution against a disposable local Supabase database. Never equate dry-run output with SQL execution.

## Documentation expectations

Update canonical docs in the same change when behavior or architecture changes. Add an ADR for a durable decision. Use present tense only for implemented behavior and label future work explicitly.

Avoid duplicated prose: link to [Database](DATABASE.md), [Lesson System](LESSON_SYSTEM.md), or another canonical page.
