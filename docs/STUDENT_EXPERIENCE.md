# Student Experience

## Contents

- [Architecture decision](#architecture-decision)
- [Lesson shell](#lesson-shell)
- [Navigation and progress](#navigation-and-progress)
- [Transitions and AI milestone](#transitions-and-ai-milestone)
- [Completion, review, and restart](#completion-review-and-restart)
- [Local persistence](#local-persistence)
- [Accessibility and resilience](#accessibility-and-resilience)
- [Future account progress](#future-account-progress)

## Architecture decision

The Lesson Player uses **one primary activity per screen**. All renderers stay mounted in hidden containers so navigating backward does not reset quiz and activity-local state. This reuses the existing activity registry instead of creating a second rendering system.

See [ADR 0005](ADR/0005-student-experience.md).

## Lesson shell

`LessonPage` resolves the static lesson and hierarchy context. `LessonPlayer` composes:

- `LessonHeader` with title, description, position, percentage, remaining estimate, and exit route;
- desktop activity outline;
- contextual activity introduction;
- `ActivityRenderer` inside `ActivityErrorBoundary`;
- `LessonNavigator`;
- transition panel;
- completion screen.

`MainLayout` uses an immersive mode for lessons so the global learner shell does not compete with lesson controls.

## Navigation and progress

The student explicitly selects **Complete Activity** (or **Complete Lesson** on the last step). Rendering alone does not complete an activity.

Rules:

- Previous is disabled on the first step.
- Future steps are not offered in the outline until supported by current/completed state.
- Previous completed activities remain reviewable.
- Progress uses completed activity count and is clamped between 0 and 100.
- Empty arrays avoid division and render an explicit empty state.
- A one-activity lesson follows the same explicit completion rule.
- Listening, practice, and quiz renderers can report readiness before the completion action enables.
- AI mission result submission is optional for lesson navigation.

Pure functions in `studentExperience.ts` calculate progress, time estimates, state normalization, labels, and deterministic completion messages.

Estimated minutes use activity metadata where supported by the learner type and otherwise type-based values. The interface labels time as an estimate.

## Transitions and AI milestone

After explicit completion, a short deterministic transition appears. It is immediately dismissible and uses an accessible live status.

When the next activity is an AI mission, the transition says **Final Speaking Challenge** and accurately explains that the learner will use an external AI pronunciation coach. It does not imply native integration.

## Completion, review, and restart

The final screen displays only real session facts:

- lesson title;
- completed activity count;
- completion percentage;
- estimated practice time;
- encouragement;
- Review Lesson, Restart Lesson, and hierarchy return actions.

It does not invent accuracy, pronunciation scores, XP, streaks, badges, quiz results, or AI results.

Review returns to the first activity while preserving completed indicators. Restart requires confirmation, clears only the current lesson navigation state, and returns to the first activity.

## Local persistence

There is no secure learner progress backend. `useLessonState` persists:

- current activity index;
- completed activity indexes.

The key is namespaced as `pronouncelab:lesson:<lessonId>`. State is validated and normalized against the current activity count. Corrupt values and deleted steps fall back safely.

`useUserProgress` separately persists locally started/completed lessons and per-lesson activity indexes. `LessonPlayer` combines both local sources when rendering completion. Neither source is synchronized.

This persistence is device/browser local and is not currently namespaced to an authenticated learner. Pasted AI feedback is not stored there.

Separate existing utilities store dashboard progress, statistics, and achievements locally. These are not server truth and are not used to fabricate Lesson Player completion data.

## Accessibility and resilience

- Semantic Previous/Continue/Complete buttons and visible focus treatment.
- ARIA-valued progress bar plus readable text.
- Live regions for activity and completion changes.
- Mobile tap-sized controls and compact progress.
- Reduced-motion CSS support.
- Logical headings and labels.
- `ActivityErrorBoundary` prevents a renderer failure from crashing the full app.
- Unsupported activity types render a controlled fallback.
- Long content wraps; mobile does not require a permanent sidebar.

Manual browser coverage is still necessary because no automated test runner exists.

## Future account progress

**Not implemented.** Synchronized progress requires learner authentication strategy, stable mapping from static lesson IDs to published versions, enrollment/attempt tables, RLS, conflict semantics, privacy policy, and migration of device-local state. It should replace, not silently reinterpret, local progress.
