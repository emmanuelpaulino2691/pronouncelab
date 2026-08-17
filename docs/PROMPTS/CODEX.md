# Codex Repository Prompt

Use this prompt when starting a Codex session for PronounceLab.

```text
You are collaborating on PronounceLab with Emmanuel Paulino, an English
pronunciation platform whose slogan is “Improve your English every day.”

Read AGENTS.md first. Then read only the canonical docs relevant to the task.
Inspect the current repository before proposing or editing anything. Repository
evidence overrides assumptions and stale prompt context.

Critical current boundaries:
- learner routes use static TypeScript content through localContentProvider;
- the Supabase Content Studio does not yet deliver content to learner routes;
- draft content is editable, but published/archived version trees are sealed;
- RLS and RPC authorization are the security boundary;
- AI Speaking Missions use external ChatGPT/Gemini copy/paste, not an AI API;
- learner lesson progress and AI result confirmation are local, not synchronized.

Trace the complete path for every change: route → component/hook → service →
types → database policies/RPCs/triggers where applicable. Reuse existing
architecture. Do not create parallel registries, clients, permission models, or
lesson systems. Preserve compound parent scoping, stale-result protection,
optimistic concurrency, mobile behavior, and accessibility.

Before editing, state a concise plan and likely files. Do not install
dependencies, change environment values, apply migrations, switch branches,
commit, push, merge, or discard work unless explicitly asked.

For SQL, inspect the effective definition across all migrations. Never edit an
applied migration. Security-definer functions use search_path = '', qualified
objects, internal authorization, and narrow grants. Preserve hierarchy gate
ordering: gate → authoritative revalidation → child locks → mutation.

After changes run:
  npm.cmd run build
  npm.cmd run lint
  git diff --check

Run relevant existing tests if available; do not invent a passing test result.
Review the final diff, update canonical docs when contracts change, and report
files, validation, limitations, git status, and diff stat. Do not commit or push
unless explicitly requested.

Documentation updates are part of sprint completion and must be proposed or
applied before the sprint is considered complete. After every completed sprint:
- review and update docs/SPRINT_STATUS.md;
- update docs/ROADMAP.md when priorities or future sprint plans changed;
- update docs/ARCHITECTURE.md when architecture changed;
- update docs/PROJECT_CONTEXT.md when product scope or project status changed;
- add or supersede an ADR under docs/ADR/ when an important architectural
  decision was introduced.
```

## Best use

Give Codex a concrete outcome and constraints after this prompt. For reviews, say “do not modify files” and name the defect classes to evaluate. For implementation, say whether migration application or Git operations are authorized.

## Repository references

- [Agent guide](../../AGENTS.md)
- [Architecture](../ARCHITECTURE.md)
- [Database](../DATABASE.md)
- [Development](../DEVELOPMENT.md)
