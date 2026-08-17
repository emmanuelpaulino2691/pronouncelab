# PronounceLab Studio UI Guidelines

## Version

| Field | Value |
| --- | --- |
| Version | 1.0 |
| Status | Official Studio Handbook guidance |
| Last Updated | July 22, 2026 |

## Contents

- [Purpose](#purpose)
- [Core UX Principles](#core-ux-principles)
- [Information Architecture](#information-architecture)
- [Studio Navigation](#studio-navigation)
- [Creation Workflows](#creation-workflows)
- [Forms](#forms)
- [Course Editor](#course-editor)
- [Lesson Studio](#lesson-studio)
- [Activity Picker](#activity-picker)
- [Add Block Experience](#add-block-experience)
- [Content Editing](#content-editing)
- [Feedback and System States](#feedback-and-system-states)
- [Draft, Preview, and Publish](#draft-preview-and-publish)
- [Destructive Actions](#destructive-actions)
- [Accessibility](#accessibility)
- [Responsive Behavior](#responsive-behavior)
- [Visual Consistency](#visual-consistency)
- [Anti-Patterns](#anti-patterns)
- [Future Evolution](#future-evolution)
- [Conclusion](#conclusion)

## Purpose

This document defines the official authoring experience for PronounceLab Studio. It explains how teachers should create, organize, review, and manage educational content efficiently, clearly, and safely.

The guidelines translate the Studio vision, pedagogical principles, authoring workflow, and content systems into a consistent product experience. They define expected behavior and language without prescribing technical implementation.

The Studio should help teachers concentrate on learning objectives and student experience. Software concepts should remain in the background unless teachers need them to make an informed decision.

## Core UX Principles

### Teacher-First Design

The Studio should reflect how teachers plan lessons, not how content is stored. Actions, labels, and guidance should use familiar educational language and support real teaching decisions.

### Progressive Disclosure

Show the information needed for the current decision first. Advanced options should remain available without competing with the main task. Teachers should not need to understand every capability before creating useful content.

### Clear Hierarchy

Teachers should always understand which course, unit, lesson, activity, or block they are working on. Parent and child relationships should be visible without forcing teachers to remember the path.

### Low Cognitive Load

Each screen should have a clear purpose, a clear primary action, and a manageable amount of information. Related choices should be grouped, and repeated administrative work should be reduced.

### Consistency

Similar actions should use the same language, visual treatment, position, and behavior throughout the Studio. Familiar patterns are more valuable than novelty.

### Draft Safety

Teachers should be free to experiment in drafts without affecting published learning experiences. The interface must make editable, read-only, and published states easy to distinguish.

### Mobile Awareness

Authoring is primarily a desktop experience, but important tasks should remain usable on tablets and should not break on smaller screens. Student preview must support the devices students are expected to use.

### Accessibility

Accessibility is a product requirement. Teachers should be able to navigate, edit, validate, reorder, and publish content with a keyboard and assistive technology.

### Helpful Guidance

Guidance should be short, timely, and connected to the current task. The Studio should explain why an action matters when that knowledge supports a better teaching decision, without surrounding every field with instructions.

### Educational Language

Teacher-facing text should refer to lessons, activities, instructions, exercises, drafts, and student experience. It should avoid database terminology, internal identifiers, schemas, records, and other implementation language.

## Information Architecture

The Studio follows one educational hierarchy:

```text
Course
  → Unit
    → Lesson
      → Activity
        → Block
```

- A **Course** defines the broad learning journey.
- A **Unit** organizes a coherent stage within that journey.
- A **Lesson** provides a complete learning experience with a clear objective.
- An **Activity** defines what the student is expected to do.
- A **Block** provides the content needed to support the activity.

The hierarchy should be represented through page titles, breadcrumbs, grouped lists, and clear parent context. A teacher moving deeper into the hierarchy should retain a visible path back to each parent. The interface should show only the detail needed at the current level while keeping the surrounding context available.

Status and readiness should appear beside the item they describe. They should not replace hierarchy labels or become the only way to understand location.

## Studio Navigation

### Dashboard

The Dashboard should help teachers resume useful work. It should summarize recent courses, drafts that need attention, review tasks, and clear next actions. It should not become a reporting screen filled with metrics that do not support authoring.

### Courses List

The Courses list is the main entry point to curriculum authoring. It should support scanning, searching, filtering, sorting, and creating courses. Each course should show its title, emoji, level, status, and a concise indication of readiness or unfinished work.

### Course Editor

The Course editor should keep course identity and organization together. Units should remain clearly connected to the course, and the next useful action should be visible after saving.

### Unit Editor

The Unit editor should show the unit's purpose, its place in the course, and its lessons in learning order. Teachers should be able to create, open, reorder, and review lessons without losing course context.

### Lesson Studio

Lesson Studio is the focused workspace for lesson design. It should keep lesson context, activity order, current editor, save state, validation, preview, and publication progress understandable at the same time.

### Breadcrumbs and Current Location

Breadcrumbs should show the complete path from Courses to the current item. The current page should be identified as the final, non-linked item. Page titles and selected navigation states should reinforce the same location.

### Back Navigation

Back actions should name their destination, such as **Back to lessons**, rather than relying only on an arrow. Saving should not move the teacher unexpectedly. Browser Back and product Back actions should preserve a predictable hierarchy.

### Unsaved-Change Protection

When leaving would discard work, the Studio should warn the teacher and offer clear choices to remain, save when possible, or leave without saving. Protection should cover product navigation, browser navigation, closing an editor, and changing the selected activity when relevant.

## Creation Workflows

Creation should begin with the smallest useful decision and continue in educational order. Each successful step should leave the teacher in a clear place with an obvious next action.

### Creating a Course

1. Choose **Create course**.
2. Enter the course identity and intended level.
3. Review the generated slug and URL preview.
4. Save the course as a draft.
5. Continue to unit planning or return to the Courses list.

### Creating a Unit

1. Open the relevant course.
2. Choose **Add unit**.
3. Define the unit title, purpose, and place in the course.
4. Save the unit as a draft.
5. Continue to lesson planning.

### Creating a Lesson

The lesson creation entry should support two understandable paths:

```text
New Lesson
├── Blank Lesson
└── Lesson from Template
```

A **Blank Lesson** provides an empty draft for teachers who already know the structure they need. A **Lesson from Template** starts from an optional official teaching blueprint and remains fully editable.

Creating either kind of lesson should ask for the learning objective early and should always produce a draft. Template availability must be presented honestly according to current product capability.

Structured Lesson Template document import is a future roadmap feature. It is different from choosing an official in-product lesson blueprint and should not appear as a current capability. Current navigation and creation choices should preserve space for this future direction without delaying or complicating blank lesson creation.

### Adding an Activity

Teachers should choose an activity according to what students need to do. The Studio should explain the educational purpose of each choice, add the activity at a clear position, and open it for editing.

### Adding a Block

Teachers should add a block from within the current activity. The Studio should recommend relevant blocks first, confirm where the block will be inserted, and open the new block with the appropriate editing controls.

## Forms

Forms should support quick understanding and confident completion.

- Use visible, specific labels for every field.
- Keep helper text short and show it only when it helps a decision.
- Identify required and optional fields consistently. Do not make teachers discover requirements after saving.
- Show validation close to the relevant field and provide an accessible summary when several issues prevent progress.
- Place error messages after the affected control and connect them clearly to it.
- Use sensible defaults that reduce routine work without making educational decisions for the teacher.
- Generate the slug from the title automatically while it remains untouched, then allow manual editing.
- Show a readable URL preview beside the slug so teachers understand the result.
- Provide an emoji selector with suitable choices and an accessible text alternative. Manual input may remain available when useful.
- Avoid long, unstructured forms. Divide complex editors into named sections and reveal advanced settings only when needed.
- Group related fields, keep field order predictable, and place the primary save action where it remains easy to find.

Saving one section should not silently discard changes in another. If a form has several save points, their scope must be explicit.

## Course Editor

The Course editor should present the following information in a compact, logical order:

- **Title:** the primary course name and the source for the initial slug.
- **Emoji:** a recognizable visual marker chosen through an accessible selector.
- **Slug:** generated automatically from the title and always manually editable.
- **URL preview:** the public-facing path represented in readable form.
- **Description:** a concise explanation of the course purpose and intended learning journey.
- **Level:** the expected learner level, using choices teachers can understand.
- **Status:** a clear indication of draft, published, archived, or other supported lifecycle state.

Create and save actions should describe their result, such as **Create draft course** or **Save course changes**. Lifecycle actions must remain separate from ordinary editing. After a successful save, the teacher should stay in context and receive a clear confirmation.

## Lesson Studio

### Lesson Header

The header should identify the lesson, its parent context, lifecycle status, validation status, and current save state. It should provide access to lesson settings, preview, and the next workflow action without crowding the editing area.

### Lesson Metadata

The learning objective should be prominent. Supporting metadata should be grouped and editable without taking attention away from the activity sequence. Advanced options should be disclosed only when needed.

### Activity List

The activity list should show learning order, activity type, title, required or optional status, and a concise completeness indicator. Selecting an activity should open its editor without losing lesson context.

### Activity Editor

The editor should use controls suited to the educational content, not a generic technical form. The selected activity and the scope of each save action should remain clear.

### Activity Actions

**Add Activity** should open the purpose-led Activity Picker. Teachers should be able to move, duplicate, and delete activities using consistent, accessible controls. Ordering changes should be immediately understandable and should not depend only on drag-and-drop.

### Preview and Validation

Preview should show the lesson from the student's perspective and should be labelled honestly if only part of the experience can be represented. Validation should show blockers, warnings, and recommendations at both activity and lesson level.

### Save State

The Studio should visibly distinguish **Saving**, **Saved**, **Unsaved changes**, and **Save failed**. Save feedback should apply to the current work and should remain visible long enough to be understood.

### Publishing Separation

Publishing should not share the same treatment or position as Save. It belongs to the review workflow and should only become available when the teacher can understand readiness, preview the lesson, and make a deliberate decision.

## Activity Picker

The Activity Picker should use recognizable cards rather than a long technical dropdown. Each card should include:

- an icon;
- the official activity name;
- a short statement of its educational purpose;
- a clear selection action;
- a **Recommended** indication when the activity supports the current objective or lesson flow.

The picker should follow the official taxonomy and educational definitions in [Activity System](ACTIVITY_SYSTEM.md). It should present only activity types that can provide a meaningful authoring experience. Future activity types must not appear as available before they can be created, validated, previewed, and preserved safely.

When a lesson or product rule does not support repeated instances of an activity type, the picker should prevent accidental duplicates and explain why. It should not silently fail or rely on teachers to discover the restriction later.

## Add Block Experience

The block chooser should prioritize relevance without hiding compatible choices:

```text
Recommended for this activity
-----------------------------
Relevant blocks

More blocks
-----------
Other compatible blocks
```

Each block option should include an icon, name, and short description of the content it supports. Teachers should be able to search and filter by clear educational categories. Categories should follow the [Block System](BLOCK_SYSTEM.md), including instruction, media, learning content, practice, assessment, and justified activity-specific blocks.

Before insertion, the Studio should make the position clear: before a selected block, after it, or at the end of the activity. After insertion, the new block should be visible and ready to edit.

Blocks should support consistent actions to duplicate, move, and delete. Moving must remain available through accessible controls. Drag-and-drop may be added later as an enhancement, but it must not become the only ordering method.

## Content Editing

Editing controls should match the structure teachers naturally expect:

- **Explanations:** focused text editing with simple structure, examples, and supporting tips.
- **Vocabulary:** repeatable entries for the word or phrase, meaning, context, and useful example.
- **Word lists:** quick repeatable rows with clear ordering and optional supporting information.
- **Minimal pairs:** paired words presented together for recognition, comparison, and practice.
- **Sentences:** repeatable sentence entries with optional guidance or media.
- **Paragraphs:** readable multi-line editing with intentional paragraph boundaries.
- **Reading passages:** a comfortable long-form workspace with supporting title, instructions, and comprehension context.
- **Listening transcripts:** transcript editing connected clearly to the relevant audio and listening task.
- **Interactive exercises:** exercise-specific controls for prompts, choices, answers, feedback, and order, while preserving one recognizable practice experience.
- **AI Speaking Mission configuration:** structured fields for purpose, instructions, communication scenario, support, and prompt preview, with the teacher retaining final control.

Teachers should never need to write technical markup, structured data, internal identifiers, or code to create learning content. Automatically generated text or structure must remain editable and subject to teacher review.

## Feedback and System States

Every state should explain what happened and, when action is needed, what the teacher should do next.

| State | Expected Experience |
| --- | --- |
| Saving | Indicate that current changes are being stored and prevent conflicting repeated actions. |
| Saved | Confirm which work is safe without interrupting the teacher. |
| Unsaved changes | Keep the state visible and protect it during navigation. |
| Validation warning | Explain the improvement and why it supports lesson quality; allow progress when it is advisory. |
| Blocking error | Identify what must be fixed, why progress is blocked, and where to fix it. |
| Empty state | Explain what belongs in the area and provide one useful next action. |
| Loading | Preserve context and communicate that content is being prepared. |
| Retryable error | Use teacher-friendly language, keep existing work safe, and provide a clear retry action. |
| Read-only publisher state | Explain why content cannot be edited and which review or publication actions remain available. |
| Conflict or stale-data state | Explain that newer changes exist, protect the teacher's work, and offer safe choices to review or reload. |

Status communication should be calm and proportional. Success messages should not interrupt continued authoring, while destructive failures and publication blockers must remain visible until understood.

## Draft, Preview, and Publish

The primary workflow is:

```text
Edit Draft
→ Validate
→ Preview
→ Publish
```

**Edit Draft** is the safe creative workspace. **Validate** identifies missing or weak parts of the learning experience. **Preview** lets the teacher inspect what students will receive. **Publish** is a deliberate confirmation that the lesson is complete and ready.

These stages should remain visually and conceptually separate. Saving preserves work; it does not approve it. Publishing must never feel like an ordinary save action, and generated or imported content must never bypass teacher review.

If complete student preview or publication is not currently available, the interface should state that limitation honestly rather than suggest that a partial action completes the workflow.

## Destructive Actions

Confirmation strength should match the impact and recoverability of the action.

- **Delete block:** use a lightweight confirmation or immediate undo when the effect is local and recoverable.
- **Delete activity:** name the activity and explain that its learning content will be removed.
- **Delete lesson:** name the lesson and explain the effect on its draft content.
- **Delete unit:** explain that contained draft lessons may also be affected.
- **Delete course:** use the strongest confirmation because the action can affect the largest hierarchy.

Do not use strong confirmation dialogs for routine, reversible actions. Significant deletion should identify the exact item, state the consequence, distinguish cancel from delete clearly, and explain whether recovery is possible. Published or sealed content should follow its controlled lifecycle rather than ordinary draft deletion.

## Accessibility

The authoring experience must include:

- complete keyboard navigation for menus, forms, dialogs, editors, pickers, and workflow actions;
- visible focus that meets the PronounceLab design system;
- semantic buttons, links, headings, lists, fields, and dialog structures;
- persistent labels and programmatic descriptions for every control;
- status communication that does not rely only on color;
- comfortable touch targets for tablet and mobile interaction;
- validation messages connected to their fields and announced appropriately by screen readers;
- accessible reorder controls that name the item and direction, announce the result, and do not require dragging;
- predictable focus movement when opening or closing dialogs, adding content, deleting content, or changing editors.

Accessibility should be tested across the complete authoring flow, not assessed only at the individual control level.

## Responsive Behavior

Studio authoring is optimized for desktop because lesson design benefits from visible hierarchy and editing context. Tablet layouts should remain fully usable for common authoring, review, and preview tasks. Mobile layouts should preserve access, readability, and safe editing without horizontal breakage.

Practical expectations include:

- collapse persistent navigation into an accessible menu when space is limited;
- stack side-by-side editors when maintaining both panels would make either unusable;
- keep the selected lesson or activity context visible after layout changes;
- allow action groups to wrap without changing their meaning or priority;
- keep forms, dialogs, tables, and media controls within the viewport;
- avoid fixed panels that hide content or prevent keyboard access;
- preserve student preview at relevant learner viewport sizes.

Layouts do not need to be identical across devices. The task, language, data, safety, and action hierarchy should remain consistent.

## Visual Consistency

The Studio uses the existing [PronounceLab Design System](../DESIGN_SYSTEM.md). These guidelines do not introduce a separate visual brand.

- **Spacing:** use the established spacing rhythm to separate hierarchy, sections, fields, and actions consistently.
- **Cards:** use cards for meaningful groups or selectable choices, not as decoration around every element.
- **Buttons:** preserve established primary, secondary, and destructive hierarchy. One area should not contain several competing primary actions.
- **Icons:** use the established icon language, pair unfamiliar icons with text, and do not use icons as the only accessible label.
- **Typography:** maintain the existing type scale and readable line lengths, with clear heading levels.
- **Status badges:** use consistent labels and treatments for lifecycle and readiness states, supported by text rather than color alone.
- **Empty states:** explain the purpose of the area and offer the most useful next action.
- **Dialogs:** use a consistent accessible pattern with a clear title, consequence, action order, focus behavior, and escape route.

New authoring patterns should extend existing foundations only when the Studio has a clear educational need.

## Anti-Patterns

The Studio should avoid:

- giant, unstructured forms;
- technical database or implementation language;
- hidden or ambiguous save state;
- publishing without validation and student-perspective review;
- unorganized block lists with no relevance or category guidance;
- excessive confirmation dialogs for low-impact actions;
- relying only on color to communicate status or errors;
- unexpected navigation after saving;
- automatically generated or imported content being published without teacher review;
- long technical dropdowns when teachers need educational guidance;
- drag-and-drop as the only way to reorder content;
- exposing internal identifiers or asking teachers to write technical markup;
- presenting future, partial, or unavailable capabilities as complete.

## Future Evolution

The following directions are **Future** and are not requirements for the initial Studio redesign:

- richer student preview modes for device sizes, lesson stages, and learning contexts;
- drag-and-drop as an optional enhancement to accessible ordering controls;
- Structured Lesson Template document import that creates a reviewable draft;
- AI-assisted template generation with transparent suggestions and teacher control;
- reusable teacher-created templates with clear ownership and update behavior;
- improved tablet authoring designed for longer editing sessions.

These capabilities should build on the same hierarchy, draft safety, validation, accessibility, and teacher-review principles. Future automation should reduce effort without weakening teacher responsibility or product simplicity.

## Conclusion

PronounceLab Studio should make lesson creation feel like thoughtful teaching work, not content administration. Teachers should always understand where they are, what students are expected to learn, what remains incomplete, and what will happen next.

The desired experience is:

```text
Clear
→ Guided
→ Flexible
→ Safe
→ Efficient
```

When these qualities work together, the interface can move into the background and allow teachers to focus on creating meaningful learning experiences.
