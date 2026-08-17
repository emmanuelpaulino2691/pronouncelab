# Sprint 36 — Controlled Duplication System Implementation Plan

## Version

| Field | Value |
| --- | --- |
| Version | 1.0 |
| Status | Implementation plan; not implemented |
| Last Updated | July 22, 2026 |

## Purpose

This document defines the implementation strategy for controlled duplication of courses, units, lessons, and activities in PronounceLab Studio. The system should let teachers reuse proven educational content while preserving draft safety, ordering, version boundaries, permissions, and specialist activity data.

Duplication is one atomic authoring operation. The browser gathers teacher choices, while PostgreSQL remains responsible for authorization, hierarchy validation, locking, position normalization, identity generation, and the complete copy transaction.

## Current Architecture Findings

- Courses, units, lessons, and activities use non-negative integer `position` fields with uniqueness scoped to their parent. Courses use a catalog-wide unique position.
- Lessons are stable catalog identities. Their editable and published content belongs to `lesson_versions`.
- Draft version descendants are editable; published and archived version trees are sealed.
- Every hierarchy-sensitive authoring RPC acquires `lock_content_hierarchy_gate()` before validating and locking rows.
- Reorder RPCs avoid transient unique-position conflicts with a temporary offset and then write an exact integer permutation.
- Current activity duplication is limited to the same draft lesson version and always appends at the end.
- `duplicate_draft_lesson_activity` copies Learn blocks, listening items, pronunciation items, and quiz assessment/question/option trees. It rejects assessments that reference a listening item because it does not currently remap that reference.
- AI Speaking Mission duplication uses the dedicated `duplicate_draft_ai_speaking_mission` RPC and copies the validated configuration JSON.
- Current activity duplication preserves media foreign keys. It does not copy Storage objects or create new `media_assets` rows.
- Practice and Quiz remain current stored compatibility types. Duplication must preserve their exact stored values.
- The controlled delete implementation demonstrates why compound hierarchy operations must control parent/child order instead of relying blindly on cascades.
- The repository contains no learner submissions, enrollment, or server progress tables. Learner progress remains device-local and outside the Studio content graph.

## Goals

- Support controlled duplication of courses, units, lessons, and activities.
- Let teachers choose a valid destination and insertion position.
- Let teachers provide an optional new title where the entity has a title.
- Give duplicated courses a safe unique slug.
- Copy the complete supported authoring graph without copying publication identity or learner state.
- Keep every duplicate as draft content that requires teacher review.
- Preserve current routes, stored activity values, media governance, and static learner-content boundaries.

## Scope

Sprint 36 should add:

- one controlled RPC contract for each duplication level;
- shared destination and position presentation models;
- entity-specific duplication dialogs and orchestration;
- cross-course unit duplication;
- cross-unit lesson duplication;
- cross-lesson activity duplication;
- atomic sibling-position normalization;
- complete supported specialist-content copying;
- permission, accessibility, retry, and stale-state handling;
- SQL, pure utility, and manual browser verification.

## Out of Scope

- Reusable Block System implementation.
- Lesson Templates or template import.
- Drag-and-drop ordering.
- Published-history cloning.
- Copying learner progress, attempts, assessment submissions, analytics, or enrollments.
- Copying physical media files or creating new Storage objects.
- New activity types or conversion between activity types.
- Route redesign or new duplication routes.
- Publication workflow redesign.
- Native AI integration or copying external AI responses.

## Product Behavior

### Duplicate Course

The action appears on a draft course for editors and administrators. The dialog should:

1. Identify the source course.
2. Offer an editable new title, initially `<Source title> copy`.
3. Show an automatically proposed slug and allow deliberate editing.
4. Offer **At the end**, **Before [course]**, or **After [course]**.
5. Explain that the complete supported draft curriculum is copied and remains draft.
6. Submit one controlled RPC.

The duplicate remains in the course catalog. It receives a new course identity, copies the source course metadata and supported curriculum, and becomes visible at the chosen position. Successful duplication should select or highlight the returned course without navigating unexpectedly.

### Duplicate Unit

The action appears on a draft unit for editors and administrators. The dialog should:

1. Identify the source unit and course.
2. Offer an editable new title, initially `<Source title> copy`.
3. Let the teacher choose the same draft course or another draft course.
4. Offer an insertion position among units in that destination course.
5. Explain that supported lessons and their selected source versions are copied as new drafts.
6. Submit one controlled RPC.

After success, the current page should update immediately when the destination is the open course. For another course, show a success action such as **Open destination curriculum** without forcing navigation.

### Duplicate Lesson

The action appears when the user can create draft content in at least one valid destination unit. The dialog should:

1. Identify the source lesson and the version that will be copied.
2. Offer an editable new title, initially `<Source title> copy`.
3. Let the teacher choose the same draft unit or another draft unit, including one in another draft course.
4. Offer an insertion position among destination lessons.
5. Explain that exactly one new draft lesson version is created and publication history is not copied.
6. Submit one controlled RPC.

After success, update the current list if applicable and offer **Open duplicated lesson**. Automatic navigation is not recommended because duplication may target another unit and teachers may want to continue organizing the source list.

### Duplicate Activity

The existing action should become a dialog instead of an immediate same-version append. It should:

1. Identify the source activity and its teacher-facing type.
2. Offer an editable title, initially `<Source title> copy`.
3. Let the teacher choose the current draft lesson version or another valid draft lesson version.
4. Offer an insertion position among destination activities.
5. Explain compatibility limitations before submission.
6. Submit one controlled RPC regardless of subtype.

On success, insert the returned activity into the current timeline when the destination is open. Select and focus it when copied into the current lesson; otherwise offer an explicit destination link.

Duplication is constructive and does not require destructive confirmation.

## Destination Rules

| Operation | Same Parent | Different Parent | Required Destination State |
| --- | --- | --- | --- |
| Course | Catalog only | Not applicable | Catalog operation; source must be draft |
| Unit | Yes | Any draft course | Destination course must be draft |
| Lesson | Yes | Any unit under a draft course | Destination course and unit must be draft |
| Activity | Yes | Any draft version under a fully draft hierarchy | Course, unit, lesson, and version must all be draft |

Additional rules:

- Course and unit sources must be draft. Their deep copy must not use a sealed hierarchy as an editable source aggregate.
- A lesson may use its current draft version. If none exists, it may use its current published version as a read-only copy source. An archived-only lesson is not a valid source.
- If a lesson has both draft and published versions, the draft is the source. The dialog must state this explicitly.
- Activity sources may be draft or sealed if the user can view them, but the destination must be fully draft. Copying from sealed content is a read operation and does not mutate it.
- Editors and administrators may duplicate into valid draft destinations. Publishers remain view-only and receive no enabled duplication action.
- A source may never be treated as a destination permission shortcut. The RPC independently validates both source visibility and destination editability.
- When no valid destination exists, disable the primary action and explain that a draft course, unit, lesson, or lesson version must be created first. Do not show an empty technical selector.

## Position Model

### Teacher Choices

Every dialog uses the same choices:

- **At the end**
- **Before [item]**
- **After [item]**

### Backend Contract

The backend should receive `requested_before_sibling_id bigint default null`.

- `null` means append at the end.
- **Before [item]** sends that item's ID.
- **After [item]** resolves to the next sibling ID in the loaded ordered list; if no next sibling exists, it sends `null`.

The RPC is the final authority. It verifies that the anchor still belongs to the destination and is still eligible. If the list changed after the dialog loaded, a missing or moved anchor causes a stale-position error instead of silently placing the duplicate elsewhere.

### Atomic Normalization

Positions remain contiguous integers beginning at zero. Floating-point ordering is not introduced.

Within the transaction, the RPC should:

1. Acquire the hierarchy gate.
2. Lock destination siblings in ascending ID order.
3. Validate the anchor and calculate the insertion index.
4. Move existing sibling positions to a safe temporary range.
5. Write the duplicate and normalize every destination sibling to `0..n` in final order.
6. Return the authoritative duplicate and final position.

Cross-parent duplication changes only destination ordering. Source ordering remains unchanged.

## Copy-Depth Matrix

| Entity or Data | Course Copy | Unit Copy | Lesson Copy | Activity Copy | Treatment |
| --- | --- | --- | --- | --- | --- |
| Course row | New | — | — | — | Copy description, level, emoji; replace title/slug/position/status/identity/audit values |
| Unit rows | New per source unit | New root unit | — | — | Preserve relative order; all become draft |
| Lesson rows | New per source lesson | New per source lesson | New root lesson | — | Preserve description and relative order; reset publication pointer |
| Lesson versions | One per copied lesson | One per copied lesson | Exactly one | Destination only | New version number `1`, status draft |
| Activities | New | New | New | New root activity | Preserve type, required flag, relative order, and supported metadata |
| Learn/theory blocks | New | New | New | New | Copy values/order; retain media references |
| Listening items | New | New | New | New | Copy values/order; retain audio references |
| Pronunciation items | New | New | New | New | Copy values/order; retain audio references |
| Assessment sets | New | New | New | New | Copy values/order and remap activity/listening references |
| Questions | New | New | New | New | Copy prompt, explanation, required state, and order |
| Question options | New | New | New | New | Copy text, correctness, and order |
| AI Speaking Mission | New | New | New | New | Copy validated configuration; remap activity ID |
| Practice subtype | None exists | None exists | None exists | None exists | Preserve activity metadata and stored `practice` type |
| Quiz stored type | Preserved | Preserved | Preserved | Preserved | Do not rename to Interactive Practice |
| IDs | Regenerated | Regenerated | Regenerated | Regenerated | Maintain internal old-to-new maps only inside the transaction |
| Created/updated timestamps | Reset | Reset | Reset | Reset | Database defaults represent the duplication event |
| `updated_at` concurrency values | Reset | Reset | Reset | Reset | Never copy stale revision tokens |
| Lifecycle/publication state | Reset | Reset | Reset | Destination draft | Never copy `published_at`, `published_by`, or archived state |
| `current_published_version_id` | Reset | Reset | Reset | — | Always `null` on copied lessons |
| Publication history | Omitted | Omitted | Omitted | Omitted | No published/archived version cloning |
| Media metadata row | Linked | Linked | Linked | Linked | Preserve existing media asset foreign keys |
| Physical Storage bytes | Omitted | Omitted | Omitted | Omitted | No bucket copy or duplicated asset ownership |
| Learner progress/submissions | Omitted | Omitted | Omitted | Omitted | Not part of authoring content and currently not server-backed |
| External AI responses | Omitted | Omitted | Omitted | Omitted | Only mission authoring configuration is copied |

### Listening-Backed Assessments

The new copy engine must remove the current activity-duplication limitation. It should map each copied source listening item ID to its new listening item ID, then use that map when inserting an assessment with `listening_item_id`. Missing or cross-activity references remain a hard integrity failure.

## Versioning Behavior

- Every duplicated course, unit, and lesson is draft.
- Every duplicated lesson receives exactly one draft version with `version_number = 1`.
- `current_published_version_id`, `published_at`, and all publication actor fields are null.
- If the source lesson has a draft version, copy its complete supported content.
- If no draft exists but `current_published_version_id` identifies a published version, copy that version into the new draft.
- If both draft and published versions exist, prefer the draft because it represents the teacher's current work.
- Archived versions are ignored and never selected as a source.
- A lesson with no draft and no current published version may be duplicated as an empty lesson with one empty draft version only if the dialog explicitly identifies it as empty. The recommended initial implementation should reject it and ask the teacher to start a source draft first, avoiding accidental empty copies.
- Course and unit duplication apply this source-version selection independently to every lesson. If any lesson has no valid source version, fail the entire operation before inserting anything.
- Published version IDs and publication history are never preserved.

## Course Slug Behavior

The duplication dialog should propose a slug from the editable new title using the existing slug normalization utility.

For untouched automatic slugs:

1. Use `<normalized-title>` when available.
2. Otherwise try `<normalized-title>-copy`, then `-copy-2`, `-copy-3`, and so on.
3. Resolve the candidate inside the RPC while holding the transaction and course sibling locks.

For a manually edited slug:

- send `slug_mode = 'exact'` and the requested value;
- validate the existing slug format;
- fail with a clear `slug_conflict` result if it is already used;
- never alter the teacher's exact slug silently.

The frontend proposal improves the experience, but the RPC and unique constraint remain the final authority. Existing courses are never overwritten.

## Database and RPC Design

Use four security-definer RPCs, following current naming conventions:

- `duplicate_draft_course`
- `duplicate_draft_unit`
- `duplicate_draft_lesson`
- `duplicate_draft_lesson_activity`

The existing two-parameter activity function should be replaced forward-only with an expanded signature or a new unambiguous overload. Prefer replacing callers with one new signature and revoking the obsolete signature after compatibility is removed. AI Speaking Mission copying should become an internal subtype branch of the unified activity-copy engine rather than requiring the browser to choose an RPC by type.

All RPCs must use `security definer`, `search_path = ''`, schema-qualified objects, internal authorization, revoked `PUBLIC` execution, and an explicit `authenticated` grant.

### `duplicate_draft_course`

Recommended inputs:

- `requested_source_course_id bigint`
- `requested_title text`
- `requested_slug text`
- `requested_slug_mode text` (`auto` or `exact`)
- `requested_before_course_id bigint default null`
- `expected_source_updated_at timestamptz`

Return a structured result containing the new course row and copied unit/lesson/activity counts.

The RPC validates a draft source course, locks the source tree deterministically, validates every lesson's source version, locks the course catalog, resolves the slug, normalizes course positions, then copies parent-to-child.

### `duplicate_draft_unit`

Recommended inputs:

- `requested_source_unit_id bigint`
- `expected_source_course_id bigint`
- `requested_destination_course_id bigint`
- `requested_title text`
- `requested_before_unit_id bigint default null`
- `expected_source_updated_at timestamptz`

Return the new unit row plus copied lesson/activity counts.

The RPC validates the source and destination independently, locks both courses in ascending ID order, locks the source unit tree, normalizes destination unit positions, and performs one parent-to-child copy transaction.

### `duplicate_draft_lesson`

Recommended inputs:

- `requested_source_lesson_id bigint`
- `expected_source_unit_id bigint`
- `requested_destination_unit_id bigint`
- `requested_title text`
- `requested_before_lesson_id bigint default null`
- `expected_source_updated_at timestamptz`

Return the new lesson row, its new draft version row, and the activity count.

The RPC resolves the source version by the rules above, locks source and destination hierarchies in deterministic ID order, normalizes destination positions, creates the lesson and version, and invokes internal content-copy helpers.

### `duplicate_draft_lesson_activity`

Recommended inputs:

- `requested_activity_id bigint`
- `expected_source_lesson_version_id bigint`
- `requested_destination_lesson_version_id bigint`
- `requested_title text`
- `requested_before_activity_id bigint default null`
- `expected_source_updated_at timestamptz`

Return the new activity row and copied child counts.

The RPC validates the stored type against the current enum and supported copy branches, validates the source version and complete destination draft chain, locks source/destination versions in ascending ID order, locks their activities in ascending ID order, normalizes destination positions, and copies specialist content.

### Shared Internal SQL Helpers

Internal helpers should not be executable by API roles:

- resolve the one source version for a lesson;
- copy one activity and return its new ID;
- copy one lesson content tree using explicit old/new ID maps;
- normalize sibling positions for a specific parent;
- resolve and validate a course slug candidate.

Helpers should accept explicit parent IDs and never infer authorization from browser-provided labels.

### Locking Order

Every RPC follows:

```text
authorize
→ acquire hierarchy gate
→ validate source and destination
→ lock course rows by ID
→ lock unit rows by ID
→ lock lesson rows by ID
→ lock version rows by ID
→ lock activities and specialist children by table and ID
→ normalize destination siblings
→ insert parent-to-child
→ return authoritative result
```

The hierarchy gate prevents publication from winning between validation and copy. Ascending IDs prevent source/destination inversion when two duplications run concurrently.

### Stale-State Protection

- Course, unit, lesson, and activity RPCs receive the source row's loaded `updated_at`.
- A mismatch fails before copying and tells the teacher the source changed.
- Position anchors are checked after locks are acquired.
- Destination status is re-read after the gate and locks.
- Specialist rows with existing optimistic revision contracts are copied from the locked current database state, not from browser payloads.

### Failure Behavior

Any failed validation or insert rolls back the complete transaction. No partial hierarchy, position change, or subtype row may remain. RPC errors should use stable categories that services map to teacher-facing messages without exposing SQL details.

## Parent-to-Child Safety

Creation order is the reverse of controlled deletion:

```text
Course
→ Unit
→ Lesson
→ Lesson Version
→ Activity
→ Specialist Content
→ Assessment
→ Question
→ Option
```

Parents must exist before child inserts because hierarchy triggers resolve and lock the parent path. Each insert uses the newly generated parent ID. Old-to-new mappings remain transaction-local and are never supplied by the browser.

For listening-backed assessments, listening items are copied before assessments. Questions are copied after their assessment, and options after their question. AI configuration is inserted only after its new activity exists and through the required guarded creation context.

The operation remains atomic because all work occurs inside one RPC transaction. Trigger failures roll back both copied rows and position normalization.

## Frontend Architecture

### Shared Files

Recommended shared additions:

- `src/features/admin/duplication/duplicationTypes.ts` — presentation-only destination and position contracts.
- `src/features/admin/duplication/duplicationState.ts` — pure dialog/pending/retry state.
- `src/features/admin/duplication/DestinationPicker.tsx` — accessible hierarchy destination selection.
- `src/features/admin/duplication/PositionPicker.tsx` — End/Before/After choices.
- `src/features/admin/duplication/DuplicateDialogFrame.tsx` — shared Dialog framing, save state, and actions.

Shared code should handle interaction mechanics, not entity-specific payload construction.

### Entity-Specific Files

- `courses/CourseDuplicationDialog.tsx` and additions to `adminCourseService.ts`.
- `units/UnitDuplicationDialog.tsx` and additions to `adminUnitService.ts`.
- `lessons/LessonDuplicationDialog.tsx` and additions to `adminLessonService.ts`.
- `lesson-studio/components/ActivityDuplicationDialog.tsx` and changes to `lessonStudioService.ts`.

Affected pages:

- `AdminCoursesPage.tsx`
- `AdminCourseUnitsPage.tsx`
- `AdminUnitLessonsPage.tsx`
- `LessonStudioPage.tsx`

Do not build one giant dialog with conditional fields for every entity. Course slug behavior and lesson-version explanations are materially different. Share destination, position, close protection, and operation-state utilities while retaining entity-specific forms and messages.

### Data Loading

Destination lists should use narrow RLS-visible service queries and show only valid draft candidates. The RPC must still revalidate them. Loading a dialog must not preload full activity content; only hierarchy labels, statuses, IDs, positions, and relevant `updated_at` values are required.

### Success Integration

- Use the returned root row and IDs; never synthesize them.
- Insert into the current local list only when its parent matches the open page.
- Otherwise show a destination link.
- Refresh only the affected ordered list when a returned result is insufficient.
- Prevent stale route results from writing into a newer route.
- Use a synchronous in-flight ref in addition to React pending state.

## UX and Accessibility

- Place **Duplicate** beside Edit/Delete for course, unit, and lesson cards or rows, and retain it in each editable activity action group.
- Use headings such as **Duplicate course**, **Duplicate unit**, **Duplicate lesson**, and **Duplicate activity**.
- The primary actions should name the result: **Duplicate course**, not **Save**.
- Explain that the result is a draft and requires review.
- Use a searchable destination picker when the hierarchy is long. Group units by course and lessons by course/unit.
- Wrap long destination labels and expose their complete hierarchy to assistive technology.
- Use semantic fields and buttons, visible focus, programmatic labels, and non-color status text.
- Move initial focus to the editable title. Restore focus to the originating Duplicate button on close.
- Keep Tab and Shift+Tab inside the shared Dialog.
- Stack destination and position controls on narrow screens and keep actions reachable with internal scrolling.
- Announce loading, retryable failure, and successful completion.
- Disable close, destination changes, and repeated submission while the RPC is pending.
- On failure, preserve title, destination, position, and slug choices and allow retry.
- Read-only and publisher views should not expose an enabled duplication action.

## Error Cases

| Case | Required Handling |
| --- | --- |
| Source deleted | RPC returns source-unavailable; dialog preserves choices and offers close/reload |
| Source updated | Reject `updated_at` mismatch; ask teacher to review current source before retrying |
| Destination deleted | Reject destination-unavailable; refresh destination options |
| Destination published/sealed | Reject after gate and lock; preserve form and require another destination |
| Title blank | Inline validation before request and authoritative RPC validation |
| Title collision | Allowed for units/lessons/activities because titles are not unique; clearly identify destination |
| Automatic slug collision | RPC chooses the next deterministic copy suffix |
| Exact slug collision | Fail without changing the requested slug |
| Invalid position anchor | Return stale-position error; reload siblings and require confirmation of the new position |
| Unsupported activity type | Roll back and explain that this activity cannot yet be duplicated |
| Specialist content missing | Treat required subtype absence as integrity failure; do not create a partial activity |
| Invalid listening assessment link | Roll back; never drop or redirect the link silently |
| Media reference invalid | Existing constraints reject it; do not copy files or detach media silently |
| Partial SQL failure | Entire RPC transaction rolls back |
| Network failure | Keep dialog values and allow one deliberate retry |
| Repeated submission | Synchronous guard and disabled controls ensure one RPC call |

## Testing Strategy

### SQL-Level Tests

Use a disposable local Supabase database when Docker is available. For every RPC, verify:

- same-parent and cross-parent duplication;
- source and destination permission checks;
- publisher rejection;
- draft and sealed destination behavior;
- exact copy depth and regenerated IDs;
- one draft version per copied lesson;
- no publication pointers or audit timestamps copied;
- activity types including Practice, Quiz, and AI Speaking Mission;
- listening-backed assessment ID remapping;
- media foreign keys linked without new media rows;
- position insertion at end, before, and after;
- contiguous final positions;
- stale source and stale anchor rejection;
- concurrent duplication and publication serialization;
- transaction rollback after an induced child failure;
- no progress, submission, or external AI result data copied.

Migration validation includes a from-scratch reset, focused SQL fixtures, negative authorization cases, `db push --dry-run`, and migration-ledger comparison. A dry run alone is not execution validation.

### Frontend Tests

Without adding dependencies, add Vitest coverage for:

- destination filtering;
- Before/After-to-anchor conversion;
- automatic title and slug state;
- manual slug preservation;
- pending and retry state;
- repeated submission prevention;
- local ordered insertion;
- cross-parent success behavior;
- activity compatibility labels.

Service mapping tests should be added only if the current test setup can mock the existing Supabase boundary cleanly without a new package.

### Manual Browser Checks

- Duplicate each entity in place and across every supported parent boundary.
- Verify exactly one RPC request and a 2xx response.
- Verify dialog focus, keyboard operation, close protection, and restoration.
- Verify narrow mobile, tablet, and desktop layouts.
- Verify immediate current-list updates and explicit links for other destinations.
- Verify forced network failure retains all selections and retry issues one request.
- Verify editor/admin success and publisher/read-only absence.
- Inspect copied content depth and ordering in Studio.
- Verify learner routes and local progress are unchanged.

## Incremental Implementation Order

### Step 1 — Contracts and Pure Helpers

- Define destination, position-anchor, slug-mode, and result types.
- Add pure position conversion and dialog-state tests.
- Document exact current RPC replacement strategy.

### Step 2 — Internal SQL Copy Engine

- Add parent-to-child internal helpers and old/new ID mapping.
- Cover Learn, listening, pronunciation, quiz, Practice metadata, and AI configuration.
- Add SQL fixtures and execute from scratch locally.

### Step 3 — Controlled RPCs and Position Normalization

- Add course, unit, lesson, and expanded activity RPCs.
- Add permissions, full source/destination validation, stale checks, locking, slug resolution, and atomic reorder.
- Test same-parent and cross-parent calls before frontend integration.

### Step 4 — Shared Destination and Position UI

- Build shared pickers and dialog frame.
- Add loading, empty, failure, keyboard, focus, and responsive behavior.

### Step 5 — Lesson Duplication

- Implement first because it establishes the version-selection and deep content-copy contract used by unit and course duplication.
- Integrate same-unit and cross-unit behavior.

### Step 6 — Unit Duplication

- Reuse the verified lesson-copy helper.
- Add same-course and cross-course behavior.

### Step 7 — Course Duplication

- Reuse unit/lesson helpers.
- Add slug modes and catalog position handling.

### Step 8 — Activity Duplication Enhancement

- Replace the immediate same-version append with destination/title/position choices.
- Unify AI and non-AI service behavior behind the expanded RPC.
- Preserve all current stored activity types.

### Step 9 — Permission, Accessibility, and State Pass

- Verify role matrix, focus behavior, responsive layout, stale route protection, errors, and retry.

### Step 10 — Full QA and Documentation

- Execute SQL test matrix and application validation.
- Complete browser checks.
- Update canonical Database, Lesson System, Architecture, Roadmap, Sprint Status, and an ADR if the final durable copy-source/version policy differs from this plan.

This order starts with lesson copy because course and unit duplication depend on it. Activity UI enhancement follows the deep-copy engine so it does not create a parallel subtype implementation.

## Risks

- Deep-copy code can omit a subtype or fail to remap nested references.
- Cross-parent operations can deadlock if source and destination locks are not ordered consistently.
- Position normalization can violate unique constraints if it skips the temporary offset.
- Course copies may be large and approach transaction or statement time limits.
- Shared media references mean later media lifecycle rules must continue protecting every referencing draft and release.
- Copying a published source into a draft can surprise teachers unless the source-version label is explicit.
- Overloaded RPC signatures can leave obsolete browser contracts callable unless grants are deliberately revoked.
- Current static learner routes do not reflect duplicated Studio content; UI language must not imply immediate learner availability.

## Open Product Decisions

### Published Lesson as a Copy Source

Options:

- permit the current published version when no draft exists;
- require teachers to create a source draft first.

Recommendation: permit the current published version as a read-only source for lesson duplication only. This supports safe reuse and copy-forward without cloning publication history. Course and unit duplication should remain draft-source operations in the initial release.

Consequence: the dialog must identify whether it is copying the current draft or current published version.

### Automatic Course Slug Suffix

Options:

- `<title>-copy`, `<title>-copy-2`, and so on;
- a date or opaque identifier suffix.

Recommendation: use the readable deterministic copy suffix. It is understandable to teachers and remains stable. Exact manually edited slugs should fail on collision.

Consequence: the RPC needs separate automatic and exact slug modes.

### Post-Success Navigation

Options:

- navigate immediately to every duplicate;
- remain in context and offer an explicit destination link.

Recommendation: remain in context. Select/focus the duplicate when it belongs to the current parent; otherwise show an **Open destination** action.

Consequence: pages need parent-aware local insertion and success messaging, but teachers avoid disruptive cross-hierarchy navigation.

## Final Recommendation

Build one database copy engine first, centered on lesson-version content and explicit old-to-new ID mapping. Expose it through four narrow controlled RPCs that share the hierarchy gate, deterministic locking, draft validation, integer position normalization, and transaction rollback. Add entity-specific dialogs over shared destination and position controls.

This approach delivers flexible reuse without weakening PronounceLab's core guarantees: teachers choose where content goes, every result is a reviewable draft, sealed history remains untouched, and no partial copy can escape the transaction.
