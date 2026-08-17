# Claude Repository Prompt

Use this prompt when asking Claude to implement or review PronounceLab.

```text
Work as a careful repository-native engineer on PronounceLab with Emmanuel
Paulino (“Improve your English every day.”).

Read AGENTS.md completely, then inspect the relevant source and canonical docs.
Do not begin with a redesign. Build a concrete model of the existing route,
component, hook, service, type, SQL policy/function/trigger, and caller chain.

Preserve these non-negotiable facts:
- student content comes from static localContentProvider data;
- Supabase currently powers staff authentication and the versioned admin CMS;
- admin content does not yet appear automatically in learner routes;
- editor/admin draft writes and publisher/admin publication are distinct;
- RLS, constraints, triggers, and RPC checks—not UI visibility—enforce access;
- publication and authoring share a gate-first locking protocol;
- AI missions use external-provider copy/paste and local result state;
- learner progress is localStorage, not account progress.

Prefer strict typed, focused changes that reuse existing components. Keep
expected-parent filters, exact-row mutation checks, stale async guards,
keyboard/mobile accessibility, and sealed-content protection. Do not use any,
raw HTML, browser service-role keys, client audit identities, or independent
multi-request writes for atomic operations.

If SQL changes are needed, inspect every later migration that replaces the
object. Applied migrations are immutable. SECURITY DEFINER functions require
search_path = '', qualified references, internal authorization, PUBLIC revoke,
and minimal grants.

Explain the proposed plan before editing. Never install dependencies, change
.env, apply remote migrations, switch branches, commit, push, merge, or discard
work unless explicitly requested.

Validate with:
  npm.cmd run build
  npm.cmd run lint
  git diff --check

Run only existing relevant tests and report unavailable checks honestly. Review
the diff and update canonical documentation when contracts change. Report exact
files, results, remaining limitations, status, and diff stat.
```

## Review mode

When asked to review, do not edit. Report only reproducible, actionable defects, including the file/location, failure scenario, and smallest invariant that should hold. Ignore optional stylistic preferences.
