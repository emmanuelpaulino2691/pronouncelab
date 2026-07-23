# Sprint 35 — Studio Redesign Foundation Implementation Plan

## Version

| Field | Value |
| --- | --- |
| Version | 1.0 |
| Status | Implementation plan; no source changes completed |
| Last Updated | July 22, 2026 |

## Purpose

This document defines the migration strategy for Sprint 35, Phase 1 of the PronounceLab Studio redesign. It translates the Studio Handbook and Gap Analysis into small implementation increments that can be delivered and reviewed independently.

Sprint 35 should improve how teachers enter and understand the authoring workflow without replacing the existing content model. The current hierarchy, permission checks, draft lifecycle, parent-scoped mutations, and activity data must remain authoritative.

## Goals

- Establish a consistent teacher-first foundation for Studio navigation and creation workflows.
- Make course creation clearer through grouped fields, guided emoji selection, automatic slug generation, manual slug control, and a readable URL preview.
- Introduce an explicit lesson creation choice between a blank lesson and a future template path.
- Replace the Lesson Studio activity-type dropdown with a purpose-led card picker.
- Reduce technical language while keeping current limitations truthful.
- Preserve all existing courses, units, lessons, versions, activities, permissions, and lifecycle protections.
- Create reusable, accessible UI patterns that later Studio phases can extend.
- Keep the admin route lazy and avoid adding dependencies.

## Scope

Sprint 35 includes the following product changes:

1. Clarify Studio location through consistent page context, breadcrumbs, named back actions, and selected navigation state.
2. Refine the Courses list entry points and redesign the current course form.
3. Add a small, pure slug-generation utility and test its behavior.
4. Add an accessible emoji selector based on a curated local catalogue, with a manual fallback if required by the final interaction design.
5. Add a lesson creation chooser before the existing blank lesson form.
6. Display **Lesson from Template** as an unavailable, clearly labelled future path.
7. Replace the activity dropdown with an accessible card-based picker using current activity contracts and Handbook educational descriptions.
8. Standardize the relevant dialogs, form feedback, focus behavior, and loading/error/empty/read-only states touched by this work.
9. Add focused tests for pure presentation logic and complete manual workflow checks for UI behavior.

All changes remain within the current Studio authoring source. Existing service and database contracts should be reused unchanged unless implementation inspection reveals a defect that blocks this exact scope; such a defect must be reported rather than worked around with a parallel contract.

## Out of Scope

- Database migrations, schema changes, new columns, new RPCs, or changed lifecycle rules.
- Implementing or importing Structured Lesson Templates.
- Generating activities or blocks from a lesson template.
- AI-assisted lesson or template generation.
- Adding Vocabulary, Grammar in Context, Reading Comprehension, or the unified Interactive Practice activity model.
- Converting existing Practice or Quiz activities.
- Expanding the Studio-wide Block System.
- Complete lesson validation, review, preview, or publication workflows.
- Connecting Studio-authored content to a different learner-content source.
- Media upload or media-library redesign.
- Drag-and-drop ordering.
- Collaborative authoring, shared libraries, or teacher-created templates.
- Persisting a new lesson objective or unit goal when no current field supports it.
- Changing learner routes, learner rendering, or device-local learner progress.
- Adding packages or creating a second design system.

Future options may be visible only when they are clearly disabled and labelled as future. They must not call services, create partial content, or imply that unavailable behavior is complete.

## Components Affected

The following list is the expected implementation surface. A delivery session should recheck callers before editing and should not broaden this list without documenting the reason.

### Existing Pages and Layouts

| File | Planned Change |
| --- | --- |
| `src/features/admin/layouts/AdminLayout.tsx` | Keep the responsive shell; refine page-context labels so Course, Unit lessons, and Lesson Studio location remain consistent with page breadcrumbs. |
| `src/features/admin/components/AdminSidebar.tsx` | Preserve Dashboard and Courses as the only top-level destinations; verify active-state, drawer close, and focus behavior with the revised flows. Modify only if the shared navigation behavior requires it. |
| `src/features/admin/dashboard/AdminDashboardPage.tsx` | Keep the existing create-course query entry point and align its wording with the redesigned course flow. No dashboard data contract change. |
| `src/features/admin/courses/AdminCoursesPage.tsx` | Host the redesigned create/edit course experience, preserve filters and cards, and maintain permission-aware entry points and list updates. |
| `src/features/admin/units/AdminCourseUnitsPage.tsx` | Align hierarchy navigation and teacher-facing actions; preserve course and unit data loading and draft/read-only behavior. |
| `src/features/admin/lessons/AdminUnitLessonsPage.tsx` | Replace direct lesson-form creation with the new lesson creation chooser, preserve editing, and route successful blank-lesson creation into the current Studio workflow. |
| `src/features/admin/lesson-studio/pages/LessonStudioPage.tsx` | Replace the activity dropdown with the card picker, use teacher-facing draft language, and preserve selection, creation, reorder, duplication, deletion, save state, and read-only behavior. |

### Existing Forms, Editors, and Shared UI

| File | Planned Change |
| --- | --- |
| `src/features/admin/courses/CourseForm.tsx` | Redesign the form layout; add emoji selection, auto/manual slug behavior, URL preview, grouped fields, inline guidance, unsaved-change handling, and consistent save feedback. |
| `src/features/admin/components/HierarchyItemForm.tsx` | Preserve unit editing; allow blank-lesson creation to be opened after the new chooser without changing the current input contract. Split lesson-specific orchestration out if conditional behavior would make this shared form unclear. |
| `src/features/admin/lesson-studio/components/ActivityMetadataEditor.tsx` | Replace raw activity-type display with the shared teacher-facing label and ensure save/unsaved wording is consistent. No activity data contract change. |
| `src/features/admin/lesson-studio/editors/ActivityEditor.tsx` | Replace the current technical Practice explanation with teacher-facing compatibility guidance while retaining the legacy editor path. |
| `src/features/admin/ui/Form.tsx` | Extend existing fields only as needed for accessible hints, errors, required/optional communication, and described-by relationships. |
| `src/features/admin/ui/Button.tsx` | Reuse existing button hierarchy; modify only if picker/dialog interactions require a shared accessible state. |
| `src/features/admin/ui/Page.tsx` | Keep one shared breadcrumb and page-header pattern; add no parallel breadcrumb implementation. |
| `src/features/admin/ui/Surface.tsx` | Reuse Card, Alert, Badge, and EmptyState; extend only for a general state needed by more than one redesigned flow. |
| `src/features/admin/ui/AdminIcon.tsx` | Add only the icons required to distinguish current activity cards, template status, and course controls. |
| `src/features/admin/ui/index.ts` | Export any new shared UI primitives introduced by this sprint. |

### Existing Types and Services

| File | Planned Change |
| --- | --- |
| `src/features/admin/lesson-studio/types.ts` | Keep stored activity values unchanged. Move or add presentation metadata through a separate typed catalogue rather than changing persistence values. |
| `src/features/admin/courses/adminCourseService.ts` | No behavioral change expected. Continue sending the existing `CourseInput`, including the automatically selected next position. |
| `src/features/admin/lessons/adminLessonService.ts` | No behavioral change expected. Continue creating a draft lesson through the existing parent-scoped function. |
| `src/features/admin/lesson-studio/services/lessonStudioService.ts` | No behavioral change expected. The activity picker must call the existing draft activity creation functions. |

### New Components and Utilities

The exact filenames may be adjusted to match the nearest feature structure, but responsibilities should remain separate:

| Proposed File | Responsibility |
| --- | --- |
| `src/features/admin/ui/Dialog.tsx` | Shared accessible dialog frame with title association, Escape handling, initial focus, focus containment, focus restoration, and clear action placement. |
| `src/features/admin/courses/EmojiSelector.tsx` | Curated, keyboard-accessible emoji choices with a visible selected state and text labels. |
| `src/features/admin/courses/courseFormUtils.ts` | Pure slug normalization and URL-preview helpers. |
| `src/features/admin/courses/courseFormUtils.test.ts` | Focused slug and preview utility tests. |
| `src/features/admin/lessons/LessonCreationDialog.tsx` | Orchestrates the **Blank Lesson** and disabled **Lesson from Template** choices. |
| `src/features/admin/lesson-studio/components/ActivityPicker.tsx` | Accessible activity-card chooser with purpose, recommendation, availability, and duplicate-state messaging. |
| `src/features/admin/lesson-studio/activityCatalog.ts` | Typed presentation metadata for currently stored activity types; contains no persistence logic. |
| `src/features/admin/lesson-studio/activityCatalog.test.ts` | Verifies complete, unique presentation metadata and availability rules for current activity values. |

No new top-level page or route is required for this sprint. If a full-screen mobile chooser proves necessary, it should still be an interaction state within the existing page rather than a second authoring route.

## Navigation Changes

### Route Strategy

Keep all current admin URLs unchanged:

```text
/admin
/admin/courses
/admin/courses/:courseId
/admin/courses/:courseId/units/:unitId
/admin/courses/:courseId/units/:unitId/lessons/:lessonId/studio
```

This avoids broken bookmarks, keeps lazy route boundaries intact, and allows redesign increments to ship without migrating navigation state.

### Location and Hierarchy

- Use the shared `PageHeader` and `Breadcrumbs` pattern on hierarchy pages.
- Display the full path from Courses to the current Course, Unit, or Lesson.
- Keep the current item non-linked and marked as the current page.
- Use named back actions such as **Back to lessons** where a prominent return action is needed.
- Keep Dashboard and Courses as the only top-level sidebar destinations; units and lessons remain contextual children.
- Do not add Review, Templates, or Blocks to the sidebar before they become real destinations.

### Navigation Safety

- Closing a form or changing location with unsaved values must request confirmation.
- Saving should not unexpectedly return teachers to an unrelated page.
- The mobile drawer should close after navigation, return focus predictably, and continue supporting Escape.
- Loading and retry states should retain enough hierarchy context for the teacher to understand what is being loaded.

## Course Editor Changes

The existing course data contract already supports title, slug, description, level, emoji, position, and status. Sprint 35 changes presentation and local form behavior, not persistence.

### Grouped Form Layout

Organize the form into three concise groups:

1. **Course identity:** title and emoji.
2. **Course details:** description and level.
3. **Course address:** slug and URL preview.

Status should be displayed as read-only context because creation always produces a draft and lifecycle transitions are not part of this sprint. Position should continue to be supplied automatically from the existing list order and should no longer compete with teacher-facing identity fields. If position remains editable for compatibility, place it under a clearly labelled advanced organization section rather than beside emoji.

### Emoji Selector

- Provide a small curated catalogue suitable for common English-teaching course themes.
- Give every option an accessible text label in addition to its visual emoji.
- Support keyboard navigation, visible focus, selected state, and a default book emoji when the field is empty.
- Preserve any existing stored emoji, even when it is not in the curated catalogue.
- Do not change or normalize an existing emoji during edit unless the teacher selects a replacement.

### Automatic and Editable Slug

For a new course:

1. Generate the slug as the teacher enters the title.
2. Convert text to lowercase, remove diacritics, replace non-alphanumeric runs with one hyphen, collapse repeated hyphens, and remove leading or trailing hyphens.
3. Continue synchronization only until the teacher edits the slug directly.
4. After manual editing, preserve the teacher's value while applying the existing validation rules.
5. Offer an explicit **Use title** or equivalent reset if the product needs a way to resume automatic generation.

For an existing course, never regenerate the stored slug merely because the title changes. A slug change must be a deliberate teacher action because it may affect references outside the form.

### URL Preview

- Show a path preview based on the existing course route convention, for example `/courses/english-pronunciation`.
- Update it as the slug changes.
- Label it as an address preview, not evidence that the draft is published or available to learners.
- Keep the preview readable on narrow screens and expose the complete value to assistive technology.

### Validation and Save Behavior

- Validate title and slug inline before submission.
- Explain the allowed slug format in teacher-friendly language.
- Preserve the existing `CourseInput` shape and service calls.
- Keep create and update permission checks unchanged.
- Use **Create draft course** for creation and **Save course changes** for editing.
- On success, update the Courses list without a full reload and retain predictable context.
- On failure, keep the entered values and show an actionable error without exposing raw service details.

## Lesson Creation Changes

The **Create lesson** action should open a choice before the form:

```text
New Lesson
├── Blank Lesson
└── Lesson from Template (placeholder)
```

### Blank Lesson

1. The teacher selects **Blank Lesson**.
2. The current lesson form opens with title, description, and automatically selected position.
3. Submission calls the existing `createAdminLesson(unitId, input)` function.
4. The lesson is created with its existing draft lifecycle and parent scope.
5. After success, the page adds the lesson to the current unit and may take the teacher directly to its existing Studio route. The chosen behavior must be consistent for mouse, keyboard, and mobile use.
6. Lesson Studio continues to create the draft version through the existing controlled action; lesson creation must not simulate version creation with an extra browser write.

### Lesson from Template Placeholder

- Display a second choice card so the product direction is understandable.
- Mark it **Future** or **Coming later** and keep it disabled.
- Explain briefly that official templates will provide a guided lesson structure.
- Do not list template types, accept files, create a lesson, generate activities, or call any service.
- Do not call this placeholder “import” because Structured Lesson Template document import is a separate long-term feature.

Editing an existing lesson should bypass the creation chooser and open the current edit form directly.

## Activity Picker Redesign

### Current-to-New Migration

Replace the inline native activity dropdown and **Add** button with one **Add Activity** action. That action opens a picker containing cards.

Each card includes:

- the existing activity icon;
- the teacher-facing name;
- one short educational purpose from the Handbook;
- availability or compatibility guidance;
- a clear selection action.

The presentation catalogue should be typed against the existing `ActivityType` union so every stored type has a label and description. It should not duplicate service behavior or introduce new stored values.

### Activity Availability

- Offer Theory, Listening, Pronunciation, Quiz, and AI Speaking Mission through their current creation contracts.
- Treat Quiz as a current compatibility type even though Interactive Practice is the future Handbook direction.
- Do not offer Vocabulary, Grammar in Context, Reading Comprehension, or Interactive Practice as current types.
- Existing Practice activities must remain visible and editable through their current compatibility path.
- Because Practice has no meaningful exercise authoring, do not allow teachers to create another empty Practice activity. Show a concise explanation if Practice appears in compatibility information.
- Do not impose a duplicate restriction unless an existing product or service contract confirms it. The picker should support a typed `allowsMultiple` rule so future restrictions can be added deliberately.

### Recommendations

Sprint 35 may mark broadly useful current activities as recommended only when the recommendation is static, transparent, and educationally defensible. It must not pretend to infer a lesson objective that is not currently stored. Personalized or objective-aware recommendations remain future work.

### Interaction and Accessibility

- Open the picker from one clearly labelled button.
- Give the picker a heading and short instruction based on “What is the student expected to do?”
- Use real buttons or radio-style selectable cards with visible focus and selected state.
- Do not rely on color or icons alone.
- On selection, call the existing `createActivity` function with the current draft version and stored type.
- Keep the picker open and show a retryable error if creation fails.
- On success, close the picker, add the returned activity to the list, select it, and move focus to the new editor heading.
- Keep the current accessible Up/Down ordering path; drag-and-drop is out of scope.

## Compatibility Strategy

### Data and Service Compatibility

- Do not change table values, TypeScript persistence values, RPC signatures, or input shapes.
- Keep `CourseInput`, `HierarchyItemInput`, `ActivityType`, `LessonActivity`, and `LessonVersion` compatible with current services.
- Continue using parent-scoped unit, lesson, version, and activity operations.
- Preserve permission-based editable states and sealed read-only states.
- Keep current activity ordering, duplication, deletion, and specialist editor calls.

### Existing Content

- Existing courses retain their stored slug and emoji until intentionally edited.
- Existing units and lessons remain reachable through the same admin URLs.
- Existing lesson versions open exactly as they do before the redesign.
- Existing Theory, Listening, Pronunciation, Practice, Quiz, and AI Speaking Mission activities continue to render in Lesson Studio.
- Legacy Practice remains readable and retains metadata editing even though new Practice creation is removed.
- Quiz remains a current type until a separate, compatibility-tested Interactive Practice migration is approved.
- Unknown or future activity values must fail safely with clear unsupported-content guidance rather than being silently removed.

### Release Strategy

Deliver the redesign in independently buildable increments. Do not remove the old control until its replacement supports loading, failure, read-only, keyboard, and mobile states. Avoid maintaining two permanent creation paths; each increment should replace one entry point only after equivalence is verified.

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Automatic slug changes alter established addresses | Existing references may stop working. | Auto-generate only for untouched new-course slugs; require deliberate edits for existing courses. |
| A URL preview implies learner publication | Teachers may believe draft content is live. | Label it as an address preview and keep lifecycle status visible. |
| The template placeholder appears functional | Teachers may expect generated content or lose work. | Disable the card, label it Future, and make no service call. |
| Picker labels diverge from stored activity values | Existing activities may become uneditable or be created incorrectly. | Use one typed presentation catalogue keyed by the current `ActivityType` union. |
| Removing Practice from creation hides legacy content | Existing lessons could become incomplete in the editor. | Remove only the creation choice; keep legacy rendering and metadata editing. |
| Card picker increases bundle or visual complexity | Studio entry may become slower or harder to scan. | Keep metadata local and small, reuse current icons, and avoid new dependencies. |
| Dialog focus or unsaved-change behavior regresses accessibility | Keyboard and screen-reader users may lose context or work. | Establish one tested dialog pattern before migrating the forms and pickers. |
| Successful creation navigates before local state settles | Duplicate writes or stale updates may occur. | Await the existing service result, disable repeat submission, and navigate once using the returned identifier. |
| Raw service errors reach teachers | Technical language may create confusion or reveal internals. | Map expected failures to actionable teacher-facing messages while retaining diagnostic detail outside the UI. |
| Scope expands into templates, validation, or publishing | The foundation becomes difficult to review and risky to ship. | Enforce the Out of Scope list and record adjacent work for later phases. |

## Validation Strategy

Each implementation increment must verify:

- the current route and parent identifiers remain unchanged;
- permissions still hide or disable draft-editing actions appropriately;
- published, archived, and otherwise sealed content remains read-only;
- create and update requests preserve the existing service inputs;
- loading, empty, error, retry, success, and read-only states remain explicit;
- stale asynchronous results cannot overwrite a newer route or selection;
- forms retain teacher input after a failed save;
- slug validation matches the current accepted format;
- template actions never call a mutation;
- activity creation uses only current supported values;
- existing Practice and Quiz content remains accessible;
- keyboard navigation, visible focus, labels, focus restoration, and non-color status communication work;
- desktop, tablet, and narrow mobile layouts do not hide essential actions or overflow horizontally.

Before handoff, run:

```powershell
npm.cmd run build
npm.cmd run lint
npm.cmd test
git diff --check
git status --short
git diff --stat
```

No migration validation is required because migrations are outside Sprint 35 Phase 1.

## Testing Strategy

### Automated Tests

Use the existing Vitest setup and avoid adding a testing dependency during this sprint.

- Unit-test slug normalization with spaces, punctuation, uppercase text, repeated separators, accented characters, empty input, and numeric content.
- Unit-test the rule that automatic slug synchronization stops after manual editing and does not restart unexpectedly.
- Unit-test URL-preview formatting independently from the form.
- Unit-test that the activity presentation catalogue covers every current `ActivityType` exactly once.
- Unit-test availability rules: supported current types can be selected, Practice cannot be newly created, and future Handbook types are not represented as current stored values.
- Keep pure utilities free of browser and service dependencies so focused tests remain fast.

The repository does not currently include a component-testing library. Do not add one without approval. Interaction behavior should therefore be kept thin and driven by tested pure state helpers where practical.

### Manual Workflow Tests

Test with editor, publisher, and read-only permission states where available:

1. Open course creation from Dashboard, Courses header, and Courses empty state.
2. Enter a title and verify automatic slug and URL preview updates.
3. Edit the slug manually, change the title, and verify the manual slug is preserved.
4. Edit an existing course title and confirm the existing slug does not change automatically.
5. Select an emoji using keyboard and pointer input; verify an existing custom emoji is preserved.
6. Cancel with and without unsaved course changes; verify focus returns to the opener.
7. Open **Create lesson**, inspect both choices, and verify the template choice cannot create content.
8. Create a blank lesson once, confirm draft status and correct unit placement, then enter Lesson Studio.
9. Open **Add Activity**, scan and select cards by keyboard, and create each supported current type.
10. Simulate a creation failure and verify the picker retains context and offers a retry.
11. Open an existing lesson containing Practice and Quiz; verify both remain accessible.
12. Verify activity move, duplicate, delete, selection, and save state after picker integration.
13. Repeat core flows at desktop, tablet, and narrow mobile widths.
14. Verify no redesigned control suggests that Studio drafts are already learner-visible.

### Regression Checks

- Existing admin routes load lazily and the login/learner entry bundle is not materially inflated.
- Course search, filtering, sorting, edit, and delete behavior still works.
- Unit and lesson lists still ignore stale route results.
- AI Speaking Mission retains its lazy specialist editor.
- No learner page, content provider, or progress behavior changes.

## Implementation Order

Each step below should end in a buildable, reviewable state and can be assigned to a separate Codex session. A later step should not begin until its dependencies are merged or otherwise available in the working branch.

### Step 1 — Freeze Contracts and Add Characterization Notes

**Goal:** Confirm the redesign boundary before changing visual behavior.

**Deliverables:**

- inventory of current routes, permissions, service inputs, stored activity values, and read-only gates;
- confirmed decision that no migration or service contract change is required;
- acceptance checklist for existing Practice and Quiz compatibility;
- baseline build, lint, and test results.

**Dependencies:** This implementation plan and the canonical architecture documents.

**Complexity:** Low.

### Step 2 — Add Pure Catalogues and Utilities

**Goal:** Establish typed, testable presentation rules before components depend on them.

**Deliverables:**

- course slug and URL-preview utilities;
- local emoji catalogue with accessible names;
- current activity presentation catalogue;
- availability rule that prevents new empty Practice creation;
- focused Vitest coverage.

**Dependencies:** Step 1.

**Complexity:** Low.

### Step 3 — Establish the Shared Dialog Pattern

**Goal:** Provide one accessible interaction frame for course, lesson-choice, and activity-picker workflows.

**Deliverables:**

- dialog title and description association;
- initial focus, focus containment, Escape handling, and focus restoration;
- consistent cancel and primary-action placement;
- unsaved-change interception hook or small reusable state helper;
- responsive behavior for narrow screens.

**Dependencies:** Existing admin UI primitives.

**Complexity:** Medium.

### Step 4 — Redesign the Course Editor

**Goal:** Make course identity and address creation clear and low-friction.

**Deliverables:**

- grouped course form;
- emoji selector;
- automatic slug with manual override;
- URL preview;
- teacher-facing validation and save language;
- preservation of existing custom emoji, slug, position, status, and service behavior;
- manual permission, failure, and responsive checks.

**Dependencies:** Steps 2 and 3.

**Complexity:** Medium.

### Step 5 — Align Hierarchy Navigation

**Goal:** Make current location and return paths consistent before adding another creation layer.

**Deliverables:**

- consistent shared breadcrumbs and page context across Courses, Course curriculum, Unit lessons, and Lesson Studio;
- named back navigation;
- verified mobile drawer focus and active state;
- unchanged route definitions and lazy loading.

**Dependencies:** Step 3 for any dialog-linked navigation protection.

**Complexity:** Low.

### Step 6 — Introduce the Lesson Creation Choice

**Goal:** Separate blank creation from the future template direction without implementing templates.

**Deliverables:**

- **New Lesson** chooser;
- functional **Blank Lesson** path using the existing form and service;
- disabled, clearly labelled **Lesson from Template** placeholder;
- direct existing-lesson edit path;
- safe post-create list update and agreed Studio navigation;
- no template mutation, import, or generated content.

**Dependencies:** Steps 3 and 5.

**Complexity:** Medium.

### Step 7 — Replace the Activity Dropdown

**Goal:** Help teachers choose activities by educational purpose.

**Deliverables:**

- card-based Activity Picker;
- current type icons, names, and concise educational purposes;
- supported and compatibility availability states;
- existing service-based creation and failure recovery;
- new-activity selection and focus transfer;
- preserved activity reorder, duplicate, delete, and specialist editor behavior.

**Dependencies:** Steps 2 and 3.

**Complexity:** Medium.

### Step 8 — Teacher-Facing Language and State Pass

**Goal:** Remove technical friction in every screen touched by Sprint 35.

**Deliverables:**

- replace schema, JSON, subtype, record, and version-first wording where it is not necessary;
- use **Start lesson draft** instead of **Create draft version** while preserving the same controlled operation;
- consistent Saving, Saved, Unsaved changes, Save failed, loading, retry, empty, and read-only communication;
- honest Preview and template limitations;
- no raw technical errors in redesigned paths.

**Dependencies:** Steps 4, 6, and 7.

**Complexity:** Low.

### Step 9 — Accessibility and Responsive Audit

**Goal:** Verify the redesigned foundation as one end-to-end teacher journey.

**Deliverables:**

- keyboard-only course, lesson, and activity creation walkthrough;
- focus order and restoration checks;
- screen-reader labels and status review;
- non-color state review;
- touch target and viewport checks;
- accessible activity ordering retained alongside any visual enhancements;
- remediation of issues within the touched components.

**Dependencies:** Steps 4 through 8.

**Complexity:** Medium.

### Step 10 — Regression Validation and Documentation Handoff

**Goal:** Demonstrate that Sprint 35 is safe to merge and prepare the next phase.

**Deliverables:**

- full build, lint, and test results;
- manual workflow results and known limitations;
- final diff review confirming no migrations, dependencies, or learner changes;
- updates to canonical current-state documentation required by the delivered behavior;
- separate follow-up items for full validation, preview, publication, blocks, and templates.

**Dependencies:** All previous steps.

**Complexity:** Low.

## Completion Criteria

Sprint 35 Phase 1 is complete when a permitted teacher can create or edit a course through the redesigned form, choose a blank lesson through the new creation flow, and add a supported activity through the purpose-led picker without changing existing content contracts.

The result must remain clear, guided, flexible, safe, and efficient. Existing lessons must continue to work, future template behavior must remain visibly future, and no UI change may imply that authoring, preview, or publication capabilities exist beyond the current product boundary.
