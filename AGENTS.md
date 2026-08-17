# PronounceLab Agent Guide

This is the first file every human or AI contributor should read.

PronounceLab with Emmanuel Paulino is an English-pronunciation learning platform. Its promise is: **Improve your English every day.**

## Contents

- [Project philosophy](#project-philosophy)
- [Architecture rules](#architecture-rules)
- [Required workflow](#required-workflow)
- [Coding and security rules](#coding-and-security-rules)
- [Database and migration rules](#database-and-migration-rules)
- [Validation and Git](#validation-and-git)
- [Documentation policy](#documentation-policy)
- [Sprint philosophy](#sprint-philosophy)
- [Knowledge map](#knowledge-map)

## Project philosophy

PronounceLab combines extensive in-product practice with short, structured speaking challenges. It favors clear teaching sequences, adult-friendly design, truthful feedback, and secure content publishing over novelty.

The current product is intentionally hybrid:

- Learner routes read static TypeScript content through `localContentProvider`.
- The admin Content Studio writes a versioned Supabase content model.
- Those two content sources are **not yet connected**. Never imply that an admin edit changes learner lessons.
- AI Speaking Missions use external ChatGPT or Gemini voice experiences through copy/paste. PronounceLab does not call an AI API.
- Learner lesson state is device-local. There is no synchronized learner account progress.

Read [Project Context](docs/PROJECT_CONTEXT.md) and [Architecture](docs/ARCHITECTURE.md) before changing these boundaries.

## Architecture rules

1. Inspect before editing. Read the route, types, service, caller, database policy, and relevant migration.
2. Reuse the existing feature and shared layers. Do not create a parallel lesson player, activity registry, permission model, or Supabase client.
3. Preserve the content-source boundary. Learner-facing services continue using `localContentProvider` until a dedicated migration project replaces it.
4. Treat RLS as the browser security boundary. UI permission checks improve usability; they are not authorization.
5. Respect versioning. Draft lesson versions are editable; published and archived hierarchy content is sealed.
6. Use parent-scoped mutations. Nested writes must carry the expected parent identifier and must not permit reparenting.
7. Use trusted RPCs for multi-row or lifecycle operations. Never simulate an atomic reorder, publication, or compound create with unrelated browser requests.
8. Keep route modules lazy. Lesson Studio editors must not inflate the login or learner entry bundle unnecessarily.
9. Preserve accessibility, mobile behavior, stale-request protection, and explicit loading/error/empty/read-only states.
10. Do not add dependencies without explicit approval.

## Required workflow

### 1. Establish the baseline

Run:

```powershell
git status --short --branch
rg --files
```

Read the nearest implementation and this knowledge base. Check whether the worktree already contains user changes; never discard them.

### 2. Trace the complete behavior

For frontend work, inspect route → page → component/hook → service → types. For Supabase work, continue through RPCs, grants, policies, triggers, constraints, and every migration that later replaces an object.

Use repository evidence. If behavior is uncertain, report the uncertainty instead of guessing.

### 3. Plan the smallest coherent change

Explain the plan before editing and name likely files. Preserve established contracts unless the request explicitly changes them.

### 4. Implement and review

- Keep TypeScript strict; avoid `any`.
- Use semantic HTML and visible focus states.
- Scope asynchronous results so old route requests cannot overwrite new state.
- Never log passwords, tokens, keys, pasted AI results, or sensitive answer data.
- Do not expose raw SQL errors to learners.
- Update the canonical documentation when architecture, workflow, security, or product behavior changes.

### 5. Validate

Run the commands in [Validation and Git](#validation-and-git), inspect the diff, and summarize every modified file.

## Coding and security rules

- Follow current folder structure and naming.
- Prefer pure typed utilities for parsing, formatting, progress, and validation.
- Do not render untrusted text with `dangerouslySetInnerHTML`.
- Do not mutate lesson fixtures.
- Do not invent database columns or API capabilities.
- Do not send client-supplied audit identities.
- Do not use a service-role key in browser code.
- Keep quiz answer keys out of learner base-table reads; learner RPCs intentionally omit correctness and explanations.
- Direct lifecycle status updates must not bypass controlled publication workflows.
- Preserve transaction gates and lock ordering documented in [Database](docs/DATABASE.md).

## Database and migration rules

- Migrations are forward-only after application. Confirm the remote ledger before editing any migration.
- Never edit an applied migration. Add a timestamped migration for new behavior.
- An unapplied migration may be corrected in place only when repository and remote state prove it is pending.
- Schema-qualify SQL objects. Security-definer functions use `search_path = ''`.
- Revoke default `PUBLIC` execution and grant only the intended roles.
- Match exact enum values and function signatures, including `GRANT`/`REVOKE`.
- Keep hierarchy gate acquisition first, then authoritative hierarchy validation, child row locks, and mutation.
- Never claim a dry run executed SQL. Do not apply migrations remotely unless explicitly requested.
- Do not insert rows into `storage.objects` as a substitute for copying physical bytes.

See [Database](docs/DATABASE.md) and [ADR 0003](docs/ADR/0003-rpc-first.md).

## Validation and Git

After changes:

```powershell
npm.cmd run build
npm.cmd run lint
git diff --check
git status --short
git diff --stat
```

Run relevant existing tests. Focused pure utility tests use `npm.cmd test`; do not claim checks ran when they did not.

For migration work, also use `npx supabase db push --dry-run` and `npx supabase migration list` when the CLI and linked project are available. Use a disposable local Supabase database for execution validation when possible.

Never commit, push, merge, switch branches, apply migrations, or change environment files unless the user explicitly requests it. Never use destructive Git commands or discard uncommitted work.

## Documentation policy

The files under `docs/` are the canonical technical knowledge base.

- Documentation updates are part of sprint completion and must be proposed or applied before the sprint is considered complete.
- After every completed sprint, review and update `docs/SPRINT_STATUS.md`.
- Update `docs/ROADMAP.md` when priorities or future sprint plans changed.
- Update `docs/ARCHITECTURE.md` when architecture changed.
- Update `docs/PROJECT_CONTEXT.md` when product scope or project status changed.
- Add or supersede an ADR under `docs/ADR/` when an important architectural decision was introduced.
- Update documentation in the same change that alters a documented contract.
- Describe implemented behavior in the present tense.
- Mark proposed work as **Future** or **Not implemented**.
- Link to one canonical explanation instead of copying it.
- Do not paste migration SQL into prose; explain purpose and invariants.
- Add an ADR when a durable architectural decision changes.
- Keep known limitations honest, especially the static/Supabase content split and local-only learner progress.

## Sprint philosophy

A sprint is a vertical, reviewable product increment:

- start from the existing architecture;
- solve a concrete user problem;
- preserve security and backward compatibility;
- include loading, empty, error, permission, mobile, and accessibility states;
- validate before handoff;
- defer adjacent systems explicitly rather than faking them.

Sprint numbers describe delivery history, not runtime modules. See [Roadmap](docs/ROADMAP.md).

## Knowledge map

| Need | Read |
| --- | --- |
| Vision and scope | [Project Context](docs/PROJECT_CONTEXT.md), [Product](docs/PRODUCT.md) |
| Frontend structure | [Architecture](docs/ARCHITECTURE.md) |
| Supabase model and security | [Database](docs/DATABASE.md) |
| Activities and Lesson Studio | [Lesson System](docs/LESSON_SYSTEM.md) |
| AI mission contract | [AI Speaking Mission](docs/AI_SPEAKING_MISSION.md) |
| Learner navigation and state | [Student Experience](docs/STUDENT_EXPERIENCE.md) |
| UI conventions | [Design System](docs/DESIGN_SYSTEM.md) |
| Day-to-day work | [Development](docs/DEVELOPMENT.md), [Contributing](docs/CONTRIBUTING.md) |
| Durable decisions | [ADRs](docs/ADR/) |
| Assistant-specific briefing | [Prompts](docs/PROMPTS/) |
