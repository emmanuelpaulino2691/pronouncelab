# Sprint 35 — Studio Redesign Foundation Baseline

## Version

| Field | Value |
| --- | --- |
| Version | 1.0 |
| Status | Verified implementation baseline |
| Last Updated | July 22, 2026 |

## Purpose

This file records the verified starting point before Studio redesign implementation begins. It identifies the routes, permissions, persistence shapes, services, lifecycle gates, activity compatibility requirements, and user-interface behavior that future Studio work must preserve.

The baseline is based on inspected repository code, migrations, and canonical documentation. It describes current behavior only. It does not authorize a redesign, migration, route change, or persistence change.

## Current Routes

`src/app/router/index.tsx` defines the browser router with `createBrowserRouter`. The current admin hierarchy is:

| Route | Page | Purpose |
| --- | --- | --- |
| `/admin` | `src/features/admin/dashboard/AdminDashboardPage.tsx` | Content Studio dashboard. |
| `/admin/courses` | `src/features/admin/courses/AdminCoursesPage.tsx` | Course listing and course create/edit/delete entry points. |
| `/admin/courses/:courseId` | `src/features/admin/units/AdminCourseUnitsPage.tsx` | Course curriculum and unit management. |
| `/admin/courses/:courseId/units/:unitId` | `src/features/admin/lessons/AdminUnitLessonsPage.tsx` | Unit lesson management. |
| `/admin/courses/:courseId/units/:unitId/lessons/:lessonId/studio` | `src/features/admin/lesson-studio/pages/LessonStudioPage.tsx` | Draft-version and activity authoring. |

The `/admin` route is wrapped by `src/features/admin/routing/AdminRoute.tsx`. Its children render inside `src/features/admin/layouts/AdminLayout.tsx`.

All route pages are declared through `React.lazy` and rendered inside the local `LazyRoute` `Suspense` boundary in `src/app/router/index.tsx`. `AiSpeakingMissionEditor` has an additional editor-level lazy boundary in `src/features/admin/lesson-studio/editors/ActivityEditor.tsx`.

**Sprint 35 route decision:** keep every route path unchanged. The redesign can change interaction states inside existing pages without adding an alternative Studio hierarchy or moving authoring code into eager bundles.

## Permission and Read-Only Gates

### Verified Role Capabilities

The database role enum contains `editor`, `publisher`, and `admin`. Permission helpers are defined in `supabase/migrations/202607170002_content_rls.sql`:

| Permission | Roles |
| --- | --- |
| `can_manage_content()` | Editor, publisher, or administrator. |
| `can_edit_drafts()` | Editor or administrator. |
| `can_publish_content()` | Publisher or administrator. |

`AdminRoute` calls all three helpers after validating the current Supabase session and user. It exposes the results as `canAccessAdmin`, `canEditDrafts`, and `canPublish` through `AdminPermissionsProvider` and `useAdminPermissions`.

The browser permission values control product visibility and editability. They are not the authorization boundary. RLS policies, lifecycle triggers, and security-definer RPC checks remain authoritative.

### Route Guard

`src/features/admin/routing/AdminRoute.tsx`:

- blocks rendering while access is being checked;
- redirects missing or invalid sessions to `/login` and retains the requested location;
- denies users for whom `can_manage_content()` is false;
- shows an unavailable state when Supabase or a permission check fails;
- rechecks authorization on auth events and window focus;
- uses a sequence counter and mounted checks so an older access result cannot replace a newer check.

There is no separate route guard for each Courses, Units, Lessons, or Lesson Studio page. Those pages consume permissions from the protected route context.

### Page and Component Gates

- `AdminCoursesPage` shows create controls only when `canEditDrafts` is true. A course is editable or deletable in the UI only when `canEditDrafts && course.status === "draft"`.
- `AdminCourseUnitsPage` permits unit creation only when `canEditDrafts && course.status === "draft"`. Unit edit/delete controls additionally require `unit.status === "draft"`.
- `AdminUnitLessonsPage` permits lesson creation only when `canEditDrafts`, the course is draft, and the unit is draft. Lesson edit/delete controls additionally require `lesson.status === "draft"`.
- `LessonStudioPage` computes `editable` only when `canEditDrafts` and the course, unit, lesson, and loaded lesson version are all draft.
- A publisher without editor or administrator capability can access and browse the admin hierarchy but receives read-only UI. `canPublish` currently affects role messaging; Lesson Studio does not expose a complete publication workflow.
- Published, archived, or otherwise sealed hierarchy content remains visible to authorized content managers but is read-only. Database triggers and RLS also protect sealed content independently of these UI conditions.

### Controlled Draft Chain

Migration `202607170006_enforce_draft_parent_inserts.sql` requires a draft course before a draft unit can be inserted, and a draft course plus draft unit before a draft lesson can be inserted. Lesson draft-version and activity RPCs in `202607170007_lesson_authoring_rpcs.sql` validate the full draft chain under the hierarchy gate.

Sprint 35 must preserve both layers: permission-aware UI and database-enforced authorization/lifecycle rules.

## Course Contract

### Input and Persisted Shape

`src/features/admin/courses/adminCourseService.ts` defines:

```text
CourseInput
├── slug: string
├── title: string
├── description: string
├── level: string
├── emoji: string
└── position: number
```

`AdminCourse` adds `id`, `status`, `createdAt`, and `updatedAt`. `CourseStatus` is `draft | published | unpublished | archived`.

| Field | Current Behavior |
| --- | --- |
| `title` | Required by the HTML form and trimmed before submission. |
| `slug` | Required, manually entered, trimmed before submission. |
| `description` | Optional form value, trimmed before submission. |
| `level` | Optional free-text form value, trimmed before submission. |
| `emoji` | Optional free-text input with `maxLength={8}`; no selector or normalization. |
| `position` | Required numeric input. New-course default is calculated by `AdminCoursesPage`. |
| `status` | Returned by the service but absent from `CourseInput`; the create service sets it to `draft`. The form cannot edit status. |

### Service Functions

- `listAdminCourses()` lists RLS-visible courses ordered by position.
- `getAdminCourse(courseId)` loads one course.
- `createAdminCourse(input)` performs a direct RLS-protected insert, supplies audit user IDs, and forces `status: "draft"`.
- `updateAdminCourse(courseId, input)` performs a direct exact-row update restricted to the requested ID and `status = "draft"`.
- `deleteDraftCourse(courseId)` performs a direct exact-row delete restricted to draft status.

### Position

`AdminCoursesPage` calculates the next new position as zero for an empty list or `max(existing.position) + 1`. The current form exposes the number for manual editing. There is no dedicated course reorder service or RPC.

### Slug and Emoji

The current slug input uses the HTML pattern `[a-z0-9]+(?:-[a-z0-9]+)*` with guidance to use lowercase letters, numbers, and single hyphens. There is no automatic slug generation and no URL preview.

Emoji is plain text. The interface displays a book fallback when the stored value is empty, but the fallback is not automatically persisted.

### Stale-State Behavior

The initial course list effect uses an `active` flag on unmount. `loadCourses()` used by retry does not use a request sequence, so overlapping initial/retry requests are not fully ordered. Create and update use the authoritative returned row to update local state, and `isSaving` prevents repeated submissions. Course writes do not send an `updatedAt` concurrency token.

### Redesign Decision

Sprint 35 can redesign `CourseForm` without changing `CourseInput` or the course service functions. Automatic slug behavior, an emoji selector, grouped layout, and URL preview can remain local presentation logic. Existing course slugs and emoji values must be preserved unless the teacher deliberately changes them.

## Unit Contract

### Input Shape

Units use `HierarchyItemInput` from `src/features/admin/components/HierarchyItemForm.tsx`:

```text
HierarchyItemInput
├── title: string
├── description: string
└── position: number
```

`AdminUnit` in `src/features/admin/units/adminUnitService.ts` adds `id`, `courseId`, `status`, `createdAt`, and `updatedAt`.

### Operations

- `listAdminUnits(courseId)` lists units under the specified course ordered by position.
- `getAdminUnit(unitId, expectedCourseId)` requires both the unit ID and expected course ID.
- `createAdminUnit(courseId, input)` inserts a draft unit under the explicit course.
- `updateAdminUnit(unitId, expectedCourseId, input)` requires the expected parent, restricts the row to draft status, and cannot reparent it because `course_id` is not updated.
- `deleteDraftUnit(unitId, expectedCourseId)` requires the expected parent and draft status.

There is no dedicated unit reorder function. Unit order changes only when the teacher edits the numeric `position` in `HierarchyItemForm`; the page sorts returned or locally updated rows by that value.

### Parent and Draft Protections

The page enables create only under a draft course and enables edit/delete only for a draft unit under a draft course. The create insert supplies the parent course ID explicitly. The update/delete queries carry the expected course ID. RLS requires draft-edit permission, and the hardened insert policy requires the parent course to be draft.

Publishers and other users without `canEditDrafts` can browse RLS-visible units but do not receive create/edit/delete controls. Non-draft courses show their unit curriculum as read-only.

## Lesson Contract

### Input Shape

Lessons use the same `HierarchyItemInput` shape: `title`, `description`, and `position`. `AdminLesson` in `src/features/admin/lessons/adminLessonService.ts` adds `id`, `unitId`, `status`, `currentPublishedVersionId`, `createdAt`, and `updatedAt`.

### Operations

- `listAdminLessons(unitId)` lists lessons under the specified unit ordered by position.
- `getAdminLesson(lessonId, expectedUnitId)` requires both lesson and expected parent IDs.
- `createAdminLesson(unitId, input)` inserts a draft lesson, sets `current_published_version_id` to null, and supplies the unit ID and audit identities.
- `updateAdminLesson(lessonId, expectedUnitId, input)` requires the expected unit, draft status, and `current_published_version_id IS NULL`.
- `deleteDraftLesson(lessonId, expectedUnitId)` requires the expected unit and draft status.

There is no dedicated lesson reorder function. The numeric `position` is edited through `HierarchyItemForm`, and the page sorts the locally returned rows.

### Creation and Studio Entry

The current **Create lesson** action opens `HierarchyItemForm` directly. After successful creation, `AdminUnitLessonsPage` adds the returned lesson to the current list, sorts it, closes the form, and remains on the unit page. The teacher enters Lesson Studio separately through the row's **Open Studio** link.

Creating a lesson does not create a lesson version. The lesson row and its draft version are separate lifecycle objects.

### Parent and Draft Protections

The page requires `canEditDrafts`, a draft course, and a draft unit before exposing lesson creation. Lesson edit/delete also requires a draft lesson. Service mutations carry the expected unit ID, and the hardened insert policy requires the course and unit chain to remain draft.

## Lesson Version Contract

`src/features/admin/lesson-studio/services/lessonStudioService.ts` defines `LessonVersion` with `id`, `lessonId`, `versionNumber`, and `status`, where status is `draft | published | archived`.

### Loading

`loadLessonVersion(lessonId)` reads all RLS-visible versions in descending version order and chooses the first draft if present; otherwise it chooses the newest returned version. This means Lesson Studio may load a sealed published or archived version when no draft exists.

### Creation

`createDraftVersion(lessonId, expectedUnitId)` calls the security-definer RPC `create_lesson_draft_version`. The RPC:

- acquires the hierarchy gate;
- requires `can_edit_drafts()`;
- validates the expected lesson/unit relationship and complete draft course → unit → lesson chain;
- locks the hierarchy;
- returns an existing draft version when one exists;
- otherwise creates the next numbered draft version atomically.

In the UI, a draft lesson without a version shows **Create draft version**. No automatic version write occurs during lesson creation.

### Read-Only Behavior

`LessonStudioPage` is editable only when the full hierarchy and loaded version are draft. A published or archived version makes the Studio read-only. Database publication and immutability triggers independently seal published/archived descendants.

### Concurrency and Stale-State Behavior

Lesson Studio uses mounted state plus a mutation/request counter so results from an older route load cannot overwrite a newer hierarchy. Its shared `busy` state prevents overlapping shell mutations. Activity and hierarchy writes generally rely on exact parent/status filters and authoritative returned rows, not `updatedAt` optimistic concurrency.

Optimistic concurrency exists for specific compound editors:

- `saveQuestion()` sends `expected_updated_at` to `save_draft_quiz_question`;
- `saveAiMission()` sends `expected_updated_at` to `save_draft_ai_speaking_mission` and maps SQL conflict code `40001` to `AiMissionConflictError`.

Theory, Listening, Pronunciation, assessment settings, activity metadata, courses, units, and lessons do not send revision timestamps. Their parent-scoped exact-row responses detect missing or moved rows but do not prevent all last-write-wins updates.

## Activity Contract

### Stored Type Set

`src/features/admin/lesson-studio/types.ts` defines the current `ActivityType` values. The database enum begins in migration `202607170001_content_schema.sql` and migration `202607170008_ai_speaking_missions.sql` adds AI Speaking Mission.

The exact current stored values are:

```text
theory
listening
pronunciation
practice
quiz
ai_speaking_mission
```

### Current Type Behavior

| Stored Value | Label and Editor | New Creation Today | Duplicate | Reorder | Delete | Compatibility Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `theory` | **Theory** → `TheoryEditor` | Yes, through the generic activity dropdown and `createActivity`. | Yes, generic controlled duplication RPC. | Yes, activity-level RPC; Theory blocks also have their own reorder RPC. | Yes, exact activity/version delete. | Ordered Heading, Paragraph, Tip, Example, Image, and Audio blocks are supported. |
| `listening` | **Listening** → `ListeningEditor` | Yes. | Yes, generic controlled duplication RPC. | Yes, activity-level RPC. | Yes. | Existing item editor uses instructions, transcript, and optional draft audio selection. |
| `pronunciation` | **Pronunciation** → `PronunciationEditor` | Yes. | Yes, generic controlled duplication RPC. | Yes, activity-level RPC. | Yes. | Existing item editor uses display text, instructions, and optional draft audio selection. |
| `practice` | **Practice** → metadata plus compatibility notice in `ActivityEditor` | Yes. The current dropdown allows creation even though no exercise subtype/content editor exists. | Yes, generic controlled duplication RPC. | Yes, activity-level RPC. | Yes. | Existing Practice has metadata editing only. It must remain selectable and visible. |
| `quiz` | **Quiz** → `QuizEditor` | Yes. | Yes, generic controlled duplication RPC. | Yes, activity-level RPC; questions also have a controlled reorder RPC. | Yes. | Quiz remains a current stored type and supports assessment settings, questions, options, correctness, and explanations. |
| `ai_speaking_mission` | **AI Speaking Mission** → lazy `AiSpeakingMissionEditor` | Yes, through a dedicated creation RPC selected by `createActivity`. | Yes, through a dedicated AI duplication RPC. | Yes, activity-level RPC. | Yes. | Config save uses a dedicated optimistic-concurrency RPC. |

### Shared Activity Operations

- `createActivity(lessonVersionId, type, title)` calls `create_draft_lesson_activity` for non-AI values and `create_draft_ai_speaking_mission` for AI missions.
- `updateActivity(activityId, expectedLessonVersionId, input)` updates title and required state under an exact version parent.
- `duplicateActivity(activityId, expectedLessonVersionId, type)` calls `duplicate_draft_lesson_activity` or the dedicated `duplicate_draft_ai_speaking_mission` RPC.
- `reorderActivities(lessonVersionId, activityIds)` calls `reorder_draft_lesson_activities` with the complete ordered ID set.
- `deleteActivity(activityId, expectedLessonVersionId)` deletes the exact activity under the expected version.

The current UI supplies Up/Down, Duplicate, and Delete for every activity type when Lesson Studio is editable.

### Sprint 35 Compatibility Decisions

- Existing Practice content must remain visible, selectable, and metadata-editable.
- Current empty Practice creation remains part of this baseline. Removing it belongs to the later Activity Picker UI step and must not remove or transform stored Practice rows.
- Quiz remains a current stored and editable type throughout Sprint 35.
- Sprint 35 must not introduce `vocabulary`, `grammar_in_context`, `interactive_practice`, `reading_comprehension`, or any other Handbook direction as a stored value.
- Duplicate, reorder, and delete behavior must remain available for Practice and Quiz wherever the current draft chain permits it.

At runtime, unknown activity values are not handled by an explicit fallback. `ActivityEditor` always renders metadata and conditionally renders a known specialist editor, while type labels are indexed from a closed record. An unknown value could therefore produce an undefined label and no specialist content editor. Safe unsupported-value rendering is a future Sprint 35 acceptance requirement, not a verified current capability.

## Existing Services and Mutations

### Hierarchy Services

| File | Functions | Mutation Type |
| --- | --- | --- |
| `src/features/admin/courses/adminCourseService.ts` | `createAdminCourse`, `updateAdminCourse`, `deleteDraftCourse` | Direct RLS-protected exact-row operations. |
| `src/features/admin/units/adminUnitService.ts` | `createAdminUnit`, `updateAdminUnit`, `deleteDraftUnit` | Direct RLS-protected operations carrying the expected course ID. |
| `src/features/admin/lessons/adminLessonService.ts` | `createAdminLesson`, `updateAdminLesson`, `deleteDraftLesson` | Direct RLS-protected operations carrying the expected unit ID. |

No course, unit, or lesson reorder service exists. Their order is persisted through the `position` field in ordinary create/update input.

### Lesson Studio Shell

| File | Function | Mutation Type |
| --- | --- | --- |
| `src/features/admin/lesson-studio/services/lessonStudioService.ts` | `createDraftVersion` | Controlled `create_lesson_draft_version` RPC. |
| Same | `createActivity` | Controlled generic or AI-specific creation RPC. |
| Same | `updateActivity` | Direct RLS-protected exact activity/version update. |
| Same | `reorderActivities` | Controlled atomic reorder RPC. |
| Same | `duplicateActivity` | Controlled generic or AI-specific duplication RPC. |
| Same | `deleteActivity` | Direct RLS-protected exact activity/version delete. |

### Activity Content

`src/features/admin/lesson-studio/services/activityContentService.ts` contains:

- Theory: `addTheoryBlock`, `saveTheoryBlock`, `deleteTheoryBlock`, and RPC-backed `reorderTheoryBlocks`;
- Listening: `saveListeningItem` under the expected activity;
- Pronunciation: `savePronunciationItem` under the expected activity;
- Quiz settings: `saveAssessment` under the expected activity;
- Quiz questions: RPC-backed `createQuestion`, optimistic-concurrency `saveQuestion`, direct parent-scoped `deleteQuestion`, and RPC-backed `reorderQuestions`.

`src/features/admin/lesson-studio/services/aiMissionService.ts` contains `saveAiMission`, backed by `save_draft_ai_speaking_mission`, and `getAiMission`.

All these operations remain the current contracts. Sprint 35 should call them unchanged and must not recreate atomic version, activity, AI, quiz, or reorder behavior with unrelated browser requests.

## Navigation and UI Baseline

### Admin Sidebar and Shell

`AdminSidebar` has two top-level links: Dashboard and Courses. It displays role information, handles sign-out, and becomes an off-canvas drawer below the desktop breakpoint. The drawer has a backdrop, a close button, Escape handling, and closes after a navigation link is selected. `AdminLayout` supplies a sticky context header and determines its short label from the pathname.

The drawer autofocuses its close button when open. The inspected code does not implement an explicit focus trap or focus restoration to the menu opener.

### Dashboard Entry Points

`AdminDashboardPage` provides **Create course** and **Create a course** links to `/admin/courses?create=1` when `canEditDrafts` is true. It also provides **Browse courses**, **Manage courses**, and a conditional recent **Continue [lesson]** Studio link. Loading skeletons, an error alert with retry, statistics, recent courses, attention counts, and quick actions are present.

### Course List and Form

`AdminCoursesPage` supports search, status filtering, sorting by update/title/position, course cards, loading skeletons, an empty state, retryable errors, permission-aware actions, and browser-confirmed draft deletion. It opens `CourseForm` for creation or draft editing.

`CourseForm` is a modal-styled section with title, slug, level, emoji, numeric position, and description. Slug and emoji are manual. It has native required/pattern validation and Saving text. It closes on backdrop click or Cancel. It does not implement Escape handling, focus containment, focus restoration, grouped semantic sections, URL preview, or unsaved-change protection.

### Course Curriculum Page

`AdminCourseUnitsPage` loads the course and units together, shows a shared `PageHeader` breadcrumb back to Courses, displays the course status, and lists ordered unit cards. It has loading, empty, retryable error, and read-only states. Create/edit use `HierarchyItemForm`; delete uses `window.confirm`.

### Unit Lessons Page

`AdminUnitLessonsPage` loads course, unit, and lessons, shows breadcrumbs through Course to the current Unit, and renders a lesson table. It has loading, empty, retryable error, and read-only states. Create/edit use `HierarchyItemForm`; delete uses `window.confirm`; **Open Studio** is always the navigation entry to an existing lesson.

### Lesson Studio

`LessonStudioPage` loads the course, unit, lesson, latest relevant version, and ordered activities. It uses a custom breadcrumb implementation rather than the shared `Breadcrumbs` component. The header shows hierarchy status and a save string. **Back to lessons** is present. **Preview · Coming later** is disabled.

When a draft lesson has no version, the page shows **Create draft version**. With a version, the desktop layout uses a sticky activity sidebar and selected editor; on smaller viewports the columns stack.

The activity creation control is currently a native `Select` containing every `activityTypes` value plus a separate **Add** button. It provides labels only, with no educational description or availability state.

Activities show order, type, title, Up, Down, Duplicate, and Delete. Deletion uses `window.confirm`. Selecting an activity opens `ActivityMetadataEditor` and the matching specialist editor.

### Breadcrumbs and Back Navigation

`PageHeader` and `Breadcrumbs` in `src/features/admin/ui/Page.tsx` are used by Course and Unit hierarchy pages. Lesson Studio duplicates breadcrumb markup locally. The sidebar communicates only top-level Dashboard/Courses location. Named **Back to lessons** exists in Lesson Studio; other hierarchy return paths are primarily breadcrumbs.

### System States

- **Loading:** route-level Suspense fallback, AdminRoute access checking, page skeletons or loading text, and editor-specific loading states exist.
- **Error:** protected-route unavailable/forbidden states, page alerts, Lesson Studio errors, and specialist editor messages exist. Some service messages expose technical language.
- **Empty:** Courses, Units, Lessons, activity list, and selected-editor areas have explicit empty states.
- **Save:** Lesson Studio displays `Saving…`, `All changes saved`, or `Save failed` for shell mutations. Individual forms and editors also have their own Saving/success/error feedback.
- **Unsaved:** there is no general unsaved-change indicator or navigation protection.
- **Read-only:** hierarchy pages hide edit controls and show explanatory alerts; Lesson Studio passes `editable={false}` to editors and shows a read-only alert.
- **Mobile:** the admin shell uses a drawer and pages generally stack or wrap controls. No browser-based responsive or assistive-technology test infrastructure is configured.

## Practice and Quiz Compatibility Checklist

The following checks are mandatory for future Sprint 35 implementation. Items marked **Verified now** are supported by the inspected baseline; the final item is a required improvement because the current fallback is incomplete.

- [x] **Verified now:** lessons containing `practice` load through the current `ActivityType` contract.
- [x] **Verified now:** Practice activities can be selected from the activity list.
- [x] **Verified now:** Practice title and required metadata can be edited through `ActivityMetadataEditor` when the draft chain is editable.
- [x] **Verified now:** Quiz activities open `QuizEditor`.
- [x] **Verified now:** Quiz settings, questions, options, correct choice, explanation, and required state can be edited through current services.
- [x] **Verified now:** Practice and Quiz can be reordered through the shared activity reorder RPC.
- [x] **Verified now:** Practice and Quiz can be duplicated through `duplicate_draft_lesson_activity` when the draft chain permits it.
- [x] **Verified now:** Practice and Quiz can be deleted through the shared parent-scoped activity delete.
- [ ] **Required before replacing the picker:** unsupported or unknown stored values need an explicit safe label and content fallback; current rendering is not robust enough to claim this behavior.

## Risks and Observations

### Sprint Number Conflict

`docs/SPRINT_STATUS.md` identifies Sprint 35 as **Published Supabase Content Delivery Foundation**, with several learner-delivery phases already completed locally. `docs/STUDIO/SPRINT35_IMPLEMENTATION_PLAN.md` independently identifies Sprint 35 as **Studio Redesign Foundation**. This is a canonical planning conflict. It does not block the UI contracts technically, but the sprint name/number should be reconciled before implementation status is reported or canonical sprint documentation is updated.

### Implementation Plan Is Untracked

At baseline, `docs/STUDIO/SPRINT35_IMPLEMENTATION_PLAN.md` exists but is untracked. Its SHA-256 before this report was `F7FF39D9A367C60536717370A9D07F537DCB8FE09E1DB242B74D456EC0F41317`. This baseline does not modify it.

### Hierarchy Reorder Assumption

The implementation plan refers generally to preserving ordering contracts. Actual code has no dedicated course, unit, or lesson reorder operation. Numeric position is ordinary form input. Only activities, Theory blocks, and Quiz questions have dedicated reorder RPCs.

### Lesson Post-Create Behavior

The implementation plan leaves direct Studio navigation after blank lesson creation as a product choice. Current code does not navigate automatically; it returns to the lesson list. If Sprint 35 adds navigation, that is a deliberate UI workflow change, although it can reuse the current route and service contract.

### Parent-Scoped Hierarchy Creation

Unit and lesson creation are direct RLS-protected inserts rather than RPC-backed compound operations. They do carry explicit parent IDs, and hardened insert policies require draft ancestors. The redesign must not weaken those conditions or simulate version creation during lesson creation.

### Partial Optimistic Concurrency

Quiz question and AI mission saves use revision timestamps. Most other forms and editors do not. The implementation plan should not describe all Studio writes as optimistic-concurrency protected.

### Unknown Activity Fallback

The plan requires unknown values to fail safely. The current closed TypeScript union and database enum prevent ordinary creation of unknown values, but runtime rendering has no explicit unsupported-type component. This is a real acceptance gap for the later picker migration.

### Practice Creation

The current dropdown allows new Practice activities even though the editor explicitly states that exercise content is unavailable. Removing Practice only from new selection can be completed without a persistence change, but existing rows and all shared actions must remain supported.

### UI Features Not Yet Present

The inspected code confirms that automatic slug generation, URL preview, an emoji selector, a lesson creation chooser, activity cards, general unsaved-change protection, and a shared accessible dialog are not already implemented.

### Current Product Boundary

Canonical project documentation states that learner routes use static content and Studio writes versioned Supabase content. The Studio redesign must not claim that course URLs, draft saves, or publication controls change learner-visible lessons.

## Baseline Validation Results

Validation was run on July 22, 2026 before this file was created.

| Check | Result |
| --- | --- |
| `npm.cmd run build` | Passed. TypeScript build and Vite production build completed; 184 modules transformed. |
| `npm.cmd run lint` | Passed with no reported lint errors. |
| `npm.cmd test` | Passed: 12 test files and 125 tests. |
| `git diff --check` | Passed. No tracked whitespace errors reported. |
| Branch | `sprint-31-visual-foundation` |
| Working tree before this report | One pre-existing untracked file: `docs/STUDIO/SPRINT35_IMPLEMENTATION_PLAN.md`. No tracked modifications. |

The repository has focused Vitest utility and contract tests. It does not have configured browser component tests, end-to-end Studio tests, or live database integration tests for this UI baseline. The passing suite therefore validates compilation, lint, and existing automated contracts, not the manual role and interaction checklist.

## Final Decision

The Studio redesign foundation can proceed without:

- database migrations;
- changes to the existing service function signatures;
- admin route path changes;
- stored activity-type changes;
- dependency additions.

The required changes can remain in presentation components, local UI state, pure utilities, and typed presentation metadata while reusing current services and security boundaries.

There is no technical blocker to beginning the planned UI increments. Two coordination issues must remain explicit:

1. reconcile the duplicate use of **Sprint 35** between canonical learner-delivery work and the Studio redesign plan;
2. treat explicit unknown-activity fallback as an acceptance requirement before the activity picker fully replaces the current selector.

Neither issue requires a migration or persistence change. Existing routes, draft-chain permissions, controlled RPCs, Practice and Quiz compatibility, lazy loading, and the separation between Studio content and learner delivery are preservation requirements for every subsequent step.
