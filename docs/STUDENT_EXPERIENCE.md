# Student Experience

> Read the [Student Experience Manifesto](STUDENT_EXPERIENCE_MANIFESTO.md) first. It is the canonical source for learner experience philosophy; this document records the current learner architecture and behavior.

## Responsive Student shell

The learner `MainLayout` owns one `StudentLayoutMode` contract shared by its header, sidebar, navigation drawer, and content region. Normal learner routes use `auto`; Teacher Preview may force Desktop, Tablet, or Phone without changing learner data or runtime behavior. Desktop keeps the permanent navigation sidebar. Tablet and Phone use a compact app bar, touch-sized menu control, and focus-trapped slide-out navigation containing the same student navigation items. Lesson previews pass that same mode into `LessonPlayer`, so the outer shell and activity selector cannot disagree.

## Learner information architecture

Every learner surface answers **What should I do next?** with one primary recommendation derived from real available content and progress. Secondary actions allow browsing and review without competing with that recommendation.

| Area | Purpose | Primary next action | Current status |
| --- | --- | --- | --- |
| Home `/` | Resume daily learning | Continue the latest incomplete lesson, otherwise start or review available learning | Implemented with device-local progress |
| Courses `/courses` | Browse published learning paths | Open a course | Implemented |
| Current Course `/courses/:courseId` | Understand unit sequence and progress | Start or continue the first incomplete unit | Implemented with device-local lesson completion |
| Current Unit `/units/:unitId` | Choose the next lesson | Start/continue the next relevant lesson; completed lessons remain reviewable | Implemented |
| Lesson `/lessons/:lessonId` | Complete one guided learning session | Complete the current activity | Implemented |
| Lesson Complete | Reinforce the small win | Return to the unit or review the lesson | Implemented inside Lesson Player |
| Progress | Explain verified learning history | Continue a course or review completed work | **Future:** requires route design; device-local summary may precede accounts |
| Achievements | Celebrate rule-based milestones | Continue toward a clearly explained milestone | **Future:** requires event definitions and synchronized progress |
| Profile | Manage learner identity | Review account information | **Future:** requires learner authentication |
| Settings | Manage accessibility, language, notifications, privacy, and local data | Save a preference or manage stored data | **Future:** split local preferences from account settings |
| Classes and assignments | Show teacher-assigned published releases | Continue the next due assignment | **Future:** requires Classes backend, enrollment, assignment, and progress contracts |

Navigation uses the same concepts everywhere: **Course → Unit → Lesson → Activity**. “Continue” resumes existing device-local progress, “Start” begins untouched content, “Review” reopens completed content, and “Complete” records an explicit learning action. Teacher terms such as draft, publish, activity editor, and version never appear in the learner application.

## Home architecture

Home follows the Manifesto hierarchy: **Welcome → Today's Mission → Your Learning Journey**. A quiet **Browse all courses** link follows the journey content rather than creating another Home section. The welcome uses a learner first name only when an authenticated learner identity actually provides one; otherwise it remains the truthful **Welcome back!**. The supporting voice line is **A few focused minutes can make English feel more familiar.** Today's Mission is the single dominant action and presents Start Learning, Continue Learning, Review Lesson, no-content, or everything-completed states from published content and device-local progress.

Your Learning Journey contains only the recommended course, current unit, completed lesson count, accessible progress, and Open Course action. Home does not display isolated XP, level, streak, weekly activity, recent activity, or future-feature placeholder cards.

The implemented next-action resolver evaluates published, available lessons with at least one activity in a fixed order: resume the latest valid incomplete lesson in device-local started-lesson history; select the first incomplete lesson in the current course; select the first lesson in the first non-empty published course; otherwise return no recommendation. Stale lesson IDs are ignored.

The Home action opens the stable lesson route, where `LessonPlayer` restores the validated device-local activity index. Untouched lessons say **Start Learning**, incomplete resumed lessons say **Continue Learning**, and a completed fallback says **Review Lesson**. The accessible journey progress uses only published lesson IDs and local completion. Daily goal, streak, achievements, assignments, weekly progress, and Recent Activity are omitted because their required backing data does not exist.

Home is ordered by decision value rather than by metric density:

1. **Continue Learning** — latest incomplete lesson from available published content and valid device-local progress.
2. **Recommended next lesson** — first available incomplete lesson when no resumable lesson exists. This must be derived, not manually invented.
3. **Your Learning Journey** — course/unit context and real lesson completion.
4. **Browse all courses** — a quiet secondary action within Your Learning Journey.

### Future learner-facing lesson purpose

**Future, not implemented.** A proposed optional `lessonPurpose` field gives curriculum authors one concise, outcome-oriented sentence explaining why a lesson is useful to the learner. It is distinct from the lesson title, internal description, instructions, and completion criteria. Good values describe a practical learning outcome, such as “Practise sentence stress so your main idea is easier to understand,” without promising mastery or a measured result.

Authors would write and preview the purpose alongside core lesson metadata in Lesson Studio. Authoring guidance should require plain learner language, one idea, and a practical connection to listening or speaking. Publication validation may warn when it is absent after the field is established, but existing lessons must remain compatible and no fallback text should be generated from titles.

The same authored purpose can orient learners on Home, help them choose on Course pages, introduce the Lesson, and provide pedagogical context to an AI Speaking Mission. Those surfaces must reuse the authoritative sentence rather than creating competing variants. This improves motivation by answering **Why should I practise this?** before asking for effort. Introducing it requires a separately reviewed content-contract and authoring change; Sprint 49C.1 does not modify lesson models or persistence.

Home may summarize current device-local lesson and activity completion, but labels must identify local-only behavior where a learner could reasonably infer account synchronization.

## Course and unit experience

The learner hierarchy is one guided journey: **Courses → Course → Unit → Lesson**. All three hierarchy screens and Home consume the same pure recommendation resolver. It prioritizes a valid resumed incomplete lesson, then the first incomplete lesson in the current scope, then the first usable lesson in the first incomplete unit, and offers review only when every usable lesson in scope is complete. Empty and unavailable lessons are never recommended; stale device-local identifiers are ignored.

Course, unit, and lesson states use the same semantics:

- **Not started:** no valid local activity or completion exists; the action is **Start**.
- **In progress:** the learner has started the lesson or completed part of the current scope; the action is **Continue**.
- **Completed:** every usable lesson in the scope is complete; the action is **Review**.
- **Empty:** no published lesson with at least one learner activity is available; no active learning action is shown.

Courses places the current or recommended journey first and gives supporting courses less visual weight. Course detail presents course context and total lesson progress before one recommended unit and the remaining unit list. Unit detail presents course context and unit progress before one recommended lesson and the remaining lesson list. Recommended content appears once rather than being duplicated in the supporting grid.

Course cards show the published title, an optional non-empty description, completed lessons out of usable lessons, an accessible progress bar, a plain-language state, and a Start/Continue/Review action. They do not expose internal lifecycle status, arbitrary level labels, empty metadata, or duration claims. The Course page presents units in curriculum order with the same state and action semantics. Empty units remain visible but cannot become the recommended next action.

The Unit page preserves lesson order and distinguishes Not started, In progress, and Completed from device-local progress. In-progress lesson cards may show the validated current activity position; untouched and completed cards avoid administrative activity counts. Future locked lessons require an authoritative pedagogical or assignment rule—position alone never invents locking. Duration and `lessonPurpose` appear only when future published contracts supply them.

## Motivation architecture

Motivation is evidence-based rather than decorative:

- **Small wins:** activity transitions and Lesson Complete use deterministic encouragement without invented scores.
- **Daily Goal:** Future configurable target backed by timestamped completion events.
- **Learning streak:** Future calendar-based policy with timezone, grace, and offline reconciliation rules.
- **XP:** Future idempotent event ledger; never calculated from page views or mutable browser counters.
- **Achievements and badges:** Future versioned criteria with earned timestamps and accessible explanations.
- **Assignments:** Future class-scoped published release, due date, completion, and teacher visibility.
- **Teacher feedback:** Future private feedback record with authorship, learner visibility, and retention rules.

Placeholders may explain these future capabilities, but they never display fabricated numeric values or imply synchronization.

## Responsive and accessibility contract

Desktop uses persistent navigation and broad content grids. Tablet uses compact navigation and two-column layouts only where cards remain readable. Phone uses the top app bar, navigation drawer, one-column content, full-width primary actions, wrapping headings, and no horizontal dependency. The immersive Lesson Player keeps its own compact activity selector.

Every primary journey remains keyboard operable. Page headings identify route purpose; progress bars expose names and values; statuses are not color-only; loading/error/empty states retain navigation; drawer/dialog focus is trapped and restored; touch controls meet the 44px target; completion and transition updates use restrained live regions.

## Learner performance boundaries

Learner routes remain individually lazy-loaded. Shared shell and small shared learner renderers are retained where reuse avoids duplicate implementations. Additional renderer splitting is justified only if measured growth outweighs request and layout costs. Static template registries and admin authoring modules do not enter learner route chunks. Future dashboard widgets should load independently only when their data source and visual weight justify a new boundary.

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

`LessonPage` asynchronously resolves a learner-safe published lesson and its published unit context through the Supabase content provider. Draft, archived, and superseded lesson versions are not route data. `LessonPlayer` composes:

- `LessonHeader` with title, description, position, percentage, remaining estimate, and exit route;
- desktop activity outline;
- contextual activity introduction;
- `ActivityRenderer` inside `ActivityErrorBoundary`;
- `LessonNavigator`;
- transition panel;
- completion screen.

`MainLayout` uses an immersive mode for lessons so the global learner shell does not compete with lesson controls.

Interactive Practice is authoring-only in Sprint 39A. Learner projections do
not expose its prompts, answer keys, matching data, accepted answers, or private
explanations, and the Lesson Player has no Interactive Practice renderer yet.
Existing Practice and Quiz behavior remains unchanged.

## Navigation and progress

The student explicitly selects **Complete Activity** (or **Complete Lesson** on the last step). Rendering alone does not complete an activity.

Rules:

- Previous is disabled on the first step.
- Future steps are not offered in the outline until supported by current/completed state.
- Previous completed activities remain reviewable.
- Progress uses completed activity count and is clamped between 0 and 100.
- Empty arrays avoid division and render an explicit empty state.
- A one-activity lesson follows the same explicit completion rule.
- Listening and quiz questions report readiness before the completion action enables. Practice metadata remains reviewable without implying browser-side scoring.
- AI mission result submission is optional for lesson navigation.

Pure functions in `studentExperience.ts` calculate progress, time estimates, state normalization, labels, and deterministic completion messages.

Estimated minutes use activity metadata where supported by the learner type and otherwise type-based values. The interface labels time as an estimate.

## Transitions and AI milestone

After explicit completion, a short deterministic transition appears. It is immediately dismissible and uses an accessible live status.

When the next activity is an AI mission, the transition says **Final Speaking Challenge** and accurately explains that the learner will use an external AI pronunciation coach. It does not imply native integration.

AI Speaking Missions show English workflow instructions by default. When a
teacher provides optional Spanish instructions, learners can switch the visible
instructions between English and Spanish without changing the AI prompt. The
language control is not shown when Spanish support is absent. This is targeted
workflow support, not application-wide localization.

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

There is no secure learner progress backend. Published content identifiers are stored as strings, and legacy numeric identifiers are normalized to their decimal string form. `useLessonState` persists:

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

Listening activities provide an accessible native audio player. A transcript
is optional and remains hidden by default; when present, a keyboard-accessible
**Show transcript** control reveals one labelled transcript region and changes
to **Hide transcript**. Empty transcripts do not create learner UI.

Manual browser coverage is still necessary because the focused Vitest setup does not provide browser UI tests.

## Future account progress

**Not implemented.** Synchronized progress requires a learner authentication strategy, enrollment/attempt tables, RLS, conflict semantics, privacy policy, and migration of device-local state. It should replace, not silently reinterpret, local progress.
## Course publication

Students see a course only after the teacher or authorised publisher completes the course publication workflow. Publication validates the whole hierarchy first, so an incomplete lesson cannot create a partially updated learner experience. Existing published versions remain active when a lesson has no replacement draft.

## Classroom direction

## Student Preview

Student Preview is an admin-side, read-only presentation of learner content. It uses the same lesson player, activity renderers, audio controls, and navigation patterns as `/learn`, but its runtime mode blocks learner mutations. Preview responses may be checked locally and disappear on refresh. Preview routes are separate from `/learn`, and public learner routes remain unchanged.

When a saved draft is available to the authorized Studio viewer, preview labels it **Draft Preview**. If no remote draft or published version exists, mapped local learner fixtures may be shown as **Local Content Preview** with an explanatory message. Unsaved Lesson Studio edits are not included.

Draft activity configuration is normalized before rendering, including theory blocks, listening items, pronunciation entries, quiz questions, and AI mission configuration. Activity identifiers remain stable so preview interaction stays local and cannot affect learner progress.

**Future, not implemented.** Learners will eventually have My Classes and class workspaces for assigned published course releases, assignments, and class-scoped progress. They will not see drafts, ownership controls, publishing actions, other students’ private progress, or teacher analytics. The current learner routes and device-local progress remain unchanged.
