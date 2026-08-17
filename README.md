# PronounceLab

**PronounceLab with Emmanuel Paulino** is an English-pronunciation learning platform.

> Improve your English every day.

## Current product

PronounceLab contains two deliberately separate content paths:

- a mobile-first learner experience backed by static TypeScript lessons through `localContentProvider`;
- an authenticated Supabase Content Studio for courses, units, lessons, versioned activities, quizzes, media governance, and AI Speaking Mission authoring.

Admin-authored Supabase content is not yet delivered to learner routes. AI Speaking Missions use structured copy/paste with external ChatGPT or Gemini voice tools; there is no native AI API integration.

## Technology

- React 19 and TypeScript
- Vite
- React Router
- Tailwind CSS
- Supabase Auth, Postgres, RLS, RPCs, and Storage
- Progressive Web App support

## Start locally

```powershell
npm.cmd install
npm.cmd run dev
```

The Supabase browser client expects the public values described in `.env.example`. Never commit a real secret or service-role key.

## Quality checks

```powershell
npm.cmd run build
npm.cmd run lint
npm.cmd test
git diff --check
```

Focused pure utility tests run with Vitest. Browser and database integration tests are not currently configured.

## Routes

| Area | Routes |
| --- | --- |
| Learner | `/`, `/courses`, `/courses/:courseId`, `/units/:unitId`, `/lessons/:lessonId` |
| Authentication | `/login` |
| Content Studio | `/admin`, `/admin/courses`, nested course/unit routes, and Lesson Studio |

All page modules are lazy-loaded. `/admin` is protected by Supabase session validation and database-backed content permissions.

## Documentation

Start with [AGENTS.md](AGENTS.md), then use the [documentation index](docs/PROJECT_CONTEXT.md).

- [Product](docs/PRODUCT.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Database](docs/DATABASE.md)
- [Lesson System](docs/LESSON_SYSTEM.md)
- [AI Speaking Mission](docs/AI_SPEAKING_MISSION.md)
- [Student Experience](docs/STUDENT_EXPERIENCE.md)
- [Design System](docs/DESIGN_SYSTEM.md)
- [Development](docs/DEVELOPMENT.md)
- [Roadmap](docs/ROADMAP.md)
- [Contributing](docs/CONTRIBUTING.md)

## Contribution boundary

Inspect before editing, preserve RLS and immutable publication rules, and do not commit, push, switch branches, install dependencies, or apply migrations without explicit authorization. The full workflow is in [AGENTS.md](AGENTS.md).
