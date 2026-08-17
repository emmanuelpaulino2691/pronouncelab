# PronounceLab Studio Gap Analysis

## Version

| Field | Value |
| --- | --- |
| Version | 1.0 |
| Status | Product audit before Studio redesign |
| Last Updated | July 22, 2026 |

## Contents

- [Executive Summary](#executive-summary)
- [Audit Scope](#audit-scope)
- [Current Strengths](#current-strengths)
- [Gaps](#gaps)
- [Obsolete Features](#obsolete-features)
- [Missing Features](#missing-features)
- [Future Features](#future-features)
- [Recommended Sprint Plan](#recommended-sprint-plan)
- [Risks](#risks)
- [Quick Wins](#quick-wins)
- [Final Recommendation](#final-recommendation)

## Executive Summary

The current PronounceLab Studio provides a credible authoring foundation, but it does not yet deliver the complete teacher experience defined by the Studio Handbook. It aligns well structurally: teachers can work within a Course → Unit → Lesson → Activity hierarchy, organize drafts, edit several activity types, reorder and duplicate activities, distinguish editable from sealed content, and use a responsive administrative shell.

Alignment is lower at the workflow and pedagogical-product levels. The Studio remains closer to a structured content administration tool than the low-friction, guided lesson-design environment described by the Handbook. It lacks a complete student preview, end-to-end publication journey, reusable cross-activity Block System, lesson templates, objective-led planning, unified Interactive Practice, complete readiness validation, and learner delivery of Studio-authored content.

**Approximate completion: 38%.** This is a weighted product estimate, not a count of screens or files.

| Area | Alignment | Assessment |
| --- | ---: | --- |
| Hierarchy and draft management | 75% | Courses, units, lessons, versions, and ordered activities are usable foundations. |
| Teacher workflow and navigation | 55% | Location is clear, but planning, review, preview, and publish stages are absent. |
| Activity System | 45% | Six current types exist; the Handbook taxonomy and unified practice model do not. |
| Block System | 20% | Ordered Theory blocks exist; a Studio-wide reusable model does not. |
| Lesson Templates | 0% | No template selection or application experience exists. |
| Validation and readiness | 30% | Basic checks exist, but teachers do not receive one complete readiness assessment. |
| Preview and publication | 15% | AI Mission and Theory have partial previews; lesson preview and publication UI are absent. |
| UI and accessibility | 60% | The visual and semantic foundation is sound but inconsistent in important workflows. |

The best strategy is evolutionary. Preserve the hierarchy, permissions, draft safety, services, and specialist editors. First clarify the authoring journey and readiness model, then establish truthful preview and publication. Only after those foundations should the product replace the activity taxonomy and expand the Block System.

## Audit Scope

The audit reviewed every available Handbook source listed in the request and inspected protected access, dashboard, navigation, course/unit/lesson management, Lesson Studio, all current activity editors, media selection, validation, preview, responsive states, and accessibility patterns.

`docs/STUDIO/UI_GUIDELINES.md` does not exist. The canonical [Design System](../DESIGN_SYSTEM.md) was used only as supporting UI evidence. The missing Studio-specific document is itself a gap because a redesign lacks a Handbook-level interaction and visual contract.

This is a static product audit. It does not include teacher interviews, browser automation, assistive-technology testing, or a live publication exercise. Those checks remain necessary before final redesign decisions.

## Current Strengths

### Secure and Truthful Boundaries

Protected access is rechecked, editing and publication permissions are distinct, and controls respect role and lifecycle. Sealed content becomes read-only. The UI also labels preview, Practice authoring, and browser media publication limitations instead of presenting them as complete.

### Clear Educational Hierarchy

Navigation follows Course → Unit → Lesson → Lesson Studio. Breadcrumbs, titles, descriptions, statuses, and permission-aware actions preserve context and provide a stable mental model.

### Strong Draft Safety

Teachers can experiment in drafts while released content remains protected. Lesson versions provide a safe base for continuous improvement, even though Review and Publish are not complete product stages.

### Useful Activity Organization

Lesson Studio keeps the ordered activity list visible beside the selected editor. Teachers can create, select, reorder, duplicate, delete, title, and mark activities as required.

### Meaningful Specialist Editors

- Theory supports ordered blocks and a basic author preview.
- Listening supports instructions, transcript, and audio selection.
- Pronunciation supports display text, instructions, and audio selection.
- Quiz supports ordered questions, options, correctness, explanations, and conflict-aware saves.
- AI Speaking Mission provides structured guidance, recommendations, prompt preview, learner-card preview, list controls, and honest external-AI boundaries.

AI Speaking Mission is the strongest example of the Handbook vision because it combines focused authoring, pedagogical guidance, preview, and teacher control.

### Explicit Product States

Loading, empty, error, populated, permission-limited, and read-only states exist across the main workflow. The dashboard identifies empty draft structures and offers a continue-authoring action.

### Responsive and Accessible Foundations

The shell includes a responsive sidebar, mobile drawer, flexible forms, wrapping actions, readable status text, semantic controls, labelled navigation, breadcrumbs, status roles, and shared focus treatments. These foundations should be retained.

## Gaps

Priorities are **P0 — Foundational**, **P1 — High**, **P2 — Medium**, and **P3 — Later**.

### Course Management

#### Instructional intent is secondary to metadata

- **Current implementation:** Courses capture title, slug, level, emoji, description, and numeric position. Units and lessons capture title, description, and position.
- **Handbook expectation:** Teachers begin with audience, purpose, direction, and learning objectives.
- **Why it matters:** Structurally valid content can be created without a coherent learner outcome.
- **Suggested priority:** **P1.** Define and surface instructional intent before templates or recommendations.

#### Ordering is administrative

- **Current implementation:** Course, unit, and lesson order is entered numerically; activities and Theory blocks use Up/Down controls.
- **Handbook expectation:** Ordering is predictable, direct, and low-friction.
- **Why it matters:** Raw positions expose internal concepts and ordering behavior is inconsistent.
- **Suggested priority:** **P2.** Adopt one accessible ordering pattern after workflow contracts stabilize.

#### Readiness is not contextual

- **Current implementation:** The dashboard counts empty structures, but hierarchy pages do not guide the teacher through fixing them.
- **Handbook expectation:** Validation explains what is incomplete and what to do next.
- **Why it matters:** Aggregate warnings do not help finish the current course or unit.
- **Suggested priority:** **P1.** Add contextual readiness summaries.

### Unit Management

#### Unit planning lacks explicit learning progression

- **Current implementation:** Units provide title, description, order, lifecycle status, and access to their lessons. Teachers organize units manually without a dedicated statement of the unit goal or expected progression.
- **Handbook expectation:** A unit represents a coherent stage of the course and groups related learning goals into a progression students can follow.
- **Why it matters:** A collection of correctly ordered lessons may still lack a clear instructional journey. Templates, validation, and recommendations need explicit educational intent rather than inferring it from titles.
- **Suggested priority:** **P1.** Define a teacher-facing unit goal and use it in lesson planning and readiness guidance.

#### Unit completion is measured only by lesson presence

- **Current implementation:** The dashboard can identify units without lessons, while the unit page lists lesson metadata and status.
- **Handbook expectation:** Validation should help teachers judge whether a unit contains a meaningful and complete stage of learning.
- **Why it matters:** “Contains lessons” is necessary but insufficient. Teachers need guidance about coherence, coverage, and unfinished lesson drafts without rigidly enforcing one teaching sequence.
- **Suggested priority:** **P2.** Add a unit readiness summary after lesson-level validation is stable.

#### Unit ordering uses raw positions

- **Current implementation:** Teachers enter numeric positions when creating or editing units.
- **Handbook expectation:** Organization should feel direct, predictable, and minimally administrative.
- **Why it matters:** Numeric ordering increases cognitive load and differs from activity ordering.
- **Suggested priority:** **P2.** Include units in the shared accessible ordering pattern.

### Lesson Workflow

#### Draft → Review → Publish is incomplete

- **Current implementation:** Teachers create a lesson, create a draft version, and edit activities. No dedicated Review or visible Publish stage exists.
- **Handbook expectation:** A clear Draft → Review → Publish journey builds confidence.
- **Why it matters:** The workflow ends after editing with no product definition of “ready.”
- **Suggested priority:** **P0.** Define workflow stages before redesigning the Studio shell.

#### Authoring is not objective-led

- **Current implementation:** Teachers start from metadata and a technical activity-type selector.
- **Handbook expectation:** The learning objective determines activity choice and sequence.
- **Why it matters:** Type-first creation encourages assembling content before defining the learner outcome.
- **Suggested priority:** **P1.** Make the objective visible from lesson creation through Review.

#### Version language adds friction

- **Current implementation:** The first Studio action is “Create draft version.”
- **Handbook expectation:** Technical concerns remain in the background.
- **Why it matters:** Versioning is essential for safety but not necessarily useful as the teacher's first concept.
- **Suggested priority:** **P2.** Preserve safety while using teacher-centered language such as “Start lesson draft.”

#### No completion map

- **Current implementation:** The activity list shows type, title, and order but not content completeness or warnings.
- **Handbook expectation:** Teachers understand what remains and whether the sequence forms a complete experience.
- **Why it matters:** Teachers must open each editor and remember its state.
- **Suggested priority:** **P1.** Add readiness indicators and a lesson review summary.
### Activity System

#### Taxonomy conflicts with the Handbook

- **Current implementation:** The Studio offers Theory, Listening, Pronunciation, Practice, Quiz, and AI Speaking Mission.
- **Handbook expectation:** Vocabulary, Grammar in Context, and Reading Comprehension are added, while Practice and Quiz converge into Interactive Practice.
- **Why it matters:** A redesign based on the current selector would harden a model the Handbook intends to replace.
- **Suggested priority:** **P0 product decision; P1 delivery.** Define transition and compatibility before changing the UI.

#### Practice can be created but not authored

- **Current implementation:** Practice exposes only title and required state plus a technical deferral message.
- **Handbook expectation:** Interactive Practice contains at least one purposeful exercise.
- **Why it matters:** Teachers can create an activity that cannot fulfil its educational purpose.
- **Suggested priority:** **P0.** Prevent new empty Practice activities or route teachers to a supported alternative while preserving existing content.

#### Quiz is narrow and separate from practice

- **Current implementation:** Quiz supports single-correct option questions.
- **Handbook expectation:** Interactive Practice supports varied purposeful exercises within one recognizable activity.
- **Why it matters:** The model cannot represent much of the active-learning vision.
- **Suggested priority:** **P1.** Start with a small extensible exercise set after the transition contract is approved.

#### Official future activities are missing

- **Current implementation:** Vocabulary, Grammar in Context, and Reading Comprehension are unavailable.
- **Handbook expectation:** Each has a distinct educational role and appears in templates.
- **Why it matters:** Official template flows cannot be delivered faithfully.
- **Suggested priority:** **P2.** Add incrementally after shared activity and block foundations.

#### Activity selection lacks pedagogical guidance

- **Current implementation:** Teachers choose from a plain type dropdown.
- **Handbook expectation:** The chooser explains what students will do and supports objective-led selection.
- **Why it matters:** Labels alone require product knowledge and do not clarify educational purpose.
- **Suggested priority:** **P1.** Provide a concise purpose-led chooser.

### Block System

#### Blocks exist only in Theory

- **Current implementation:** Theory has Heading, Paragraph, Tip, Example, Image, and Audio blocks. Other editors use fixed specialist forms.
- **Handbook expectation:** Reusable blocks support instruction, media, learning content, practice, assessment, and specialist needs across activities.
- **Why it matters:** The Studio's main modularity and reuse promise is absent.
- **Suggested priority:** **P1**, after activity taxonomy decisions. Define a minimal common block contract first.

#### Existing Theory types are not fully expressed

- **Current implementation:** Block types mainly share one text area; media selection, alt text, heading level, and type-specific semantics are not fully surfaced.
- **Handbook expectation:** Each block is recognizable, independently configurable, and has one responsibility.
- **Why it matters:** Different labels produce nearly identical editing and media blocks cannot be completed confidently.
- **Suggested priority:** **P1.** Make existing block types truthful before expanding the catalogue.

#### Duplication and reuse are missing

- **Current implementation:** Theory blocks can be added, edited, reordered, and deleted, but not duplicated or reused across lessons.
- **Handbook expectation:** Duplication and reuse reduce repeated work.
- **Why it matters:** Teachers recreate common content manually.
- **Suggested priority:** **P2.** Add local duplication before shared libraries.

#### Preview is fragmented

- **Current implementation:** Theory has a simplified author preview and AI Mission has specialist previews. Other content lacks trustworthy preview.
- **Handbook expectation:** Preview is part of the block lifecycle and reflects student experience.
- **Why it matters:** Teachers cannot judge media, instructions, and interaction while composing them.
- **Suggested priority:** **P1.** Build on the shared learner preview contract.

### Lesson Templates

#### No template experience exists

- **Current implementation:** Every lesson begins empty and activities are added individually.
- **Handbook expectation:** Optional Pronunciation, Vocabulary, Grammar in Context, Listening, Reading, and Speaking blueprints reduce planning time.
- **Why it matters:** Teachers repeat planning work and receive no guidance toward complete flows.
- **Suggested priority:** **P2.** Templates depend on stable activities, blocks, and duplication behavior.

#### Blueprint behavior is undefined in-product

- **Current implementation:** There is no way to choose, customize, combine, or depart from a template.
- **Handbook expectation:** Templates guide without limiting creativity.
- **Why it matters:** Implementation could become too rigid or too vague without clear optionality semantics.
- **Suggested priority:** **P1 product definition**, before feature delivery.

### Validation

#### Validation is fragmented and save-time focused

- **Current implementation:** Basic required fields, disabled saves, AI validation, quiz constraints, service failures, and three dashboard counts operate independently.
- **Handbook expectation:** One coherent model covers course, unit, lesson, and activity, becoming stricter before publication.
- **Why it matters:** Teachers cannot see one authoritative readiness assessment.
- **Suggested priority:** **P0.** Define blockers, warnings, and recommendations in a shared validation catalogue.

#### Messages are not consistently educational

- **Current implementation:** Helpful messages coexist with terms such as schema, JSON, subtype, stale, and media asset.
- **Handbook expectation:** Messages explain the issue, why it matters, and the next step in teacher language.
- **Why it matters:** Technical wording increases cognitive load and frustration.
- **Suggested priority:** **P0 quick win.** Establish a teacher-facing message standard.

#### Publication readiness review is missing

- **Current implementation:** No screen groups blockers and recommendations before release.
- **Handbook expectation:** Validation increases confidence that students will receive a complete experience.
- **Why it matters:** Publishing cannot become a meaningful professional decision without a visible quality gate.
- **Suggested priority:** **P1.** Build Review around the shared validation catalogue.

#### Pedagogical quality is not represented

- **Current implementation:** Checks focus on missing data, not sequence quality, balance of input and practice, or connection to objectives.
- **Handbook expectation:** Validation helps prevent incomplete learning experiences, not only empty fields.
- **Why it matters:** Structurally complete lessons can remain educationally weak.
- **Suggested priority:** **P2.** Start with transparent recommendations under teacher control.

### UI / UX

#### Studio UI guidance is missing

- **Current implementation:** The canonical Design System exists, but `UI_GUIDELINES.md` does not.
- **Handbook expectation:** Consistent, teacher-confident, progressively disclosed authoring.
- **Why it matters:** The redesign lacks a contract for Studio layout, activity timelines, blocks, review, preview, responsive behavior, and accessibility.
- **Suggested priority:** **P0.** Approve Studio UI guidelines before redesign mockups become implementation commitments.

#### Editor patterns are inconsistent

- **Current implementation:** Shared primitives coexist with local buttons, raw fields, native selects, technical copy, and varied status treatments.
- **Handbook expectation:** Consistency over novelty and predictable actions.
- **Why it matters:** Similar actions look and behave differently.
- **Suggested priority:** **P1.** Standardize during workflow work, not as an isolated cosmetic rewrite.

#### Specialist editors are form-heavy

- **Current implementation:** AI Mission and Quiz use long forms and multiple save points.
- **Handbook expectation:** Progressive disclosure and low cognitive load.
- **Why it matters:** Teachers can lose context and feel they are managing forms rather than lessons.
- **Suggested priority:** **P2.** Add section progress, concise guidance, and stable context.

### Navigation

#### Navigation shows location, not workflow progress

- **Current implementation:** Breadcrumbs are strong, but Draft, Review, Preview, Publish, and readiness are not persistent stages.
- **Handbook expectation:** Teachers know both where they are and what to do next.
- **Why it matters:** Structural location is clear while completion remains unclear.
- **Suggested priority:** **P1.** Add a workflow model after the stages are defined.

#### Resume and review queues are limited

- **Current implementation:** The dashboard can continue one recent draft but has no drafts queue or review queue.
- **Handbook expectation:** Fast authoring and clear progression as content volume grows.
- **Why it matters:** Larger curricula will become difficult to manage.
- **Suggested priority:** **P2.** Expand after readiness and review states exist.
### Preview

#### Complete student preview is absent

- **Current implementation:** The lesson Preview button is disabled. Theory has a simplified preview; AI Mission reuses a learner card; other activities lack complete preview.
- **Handbook expectation:** Teachers experience the whole lesson from the student's perspective before publishing.
- **Why it matters:** Pacing, transitions, mobile behavior, instructions, media, and sequence cannot be evaluated together.
- **Suggested priority:** **P0 dependency; P1 feature.** Resolve the authoring-to-learner content boundary, then preview through the same learner contract.

#### Existing previews can diverge from delivery

- **Current implementation:** Theory's preview is locally simplified while AI Mission is closer to learner rendering.
- **Handbook expectation:** Preview is trustworthy and student-centered.
- **Why it matters:** A divergent preview creates false confidence.
- **Suggested priority:** **P1.** Share learner rendering contracts and label partial previews accurately.

### Publishing

#### Publication action and review handoff are absent

- **Current implementation:** Publication permission is detected, but no complete publisher workflow or publish action is visible.
- **Handbook expectation:** Publishing deliberately confirms a complete experience.
- **Why it matters:** Publishers can browse but cannot complete the responsibility implied by their role.
- **Suggested priority:** **P1**, after readiness and preview.

#### Studio content is not the learner source

- **Current implementation:** Studio-authored and learner content remain separate; Studio edits do not change learner lessons.
- **Handbook expectation:** The long-term workflow ends with students receiving reviewed content.
- **Why it matters:** The teacher-create-to-learner-receive value loop is incomplete.
- **Suggested priority:** **P0.** Complete the dedicated published-content delivery work first.

#### Media workflow is incomplete for teachers

- **Current implementation:** Editors select existing draft audio, but cannot complete upload, review, and publication in one teacher workflow.
- **Handbook expectation:** Media management supports complete learning experiences without distracting from instruction.
- **Why it matters:** Listening and Pronunciation lack a dependable authoring-to-release path.
- **Suggested priority:** **P1**, dependent on trusted media handling.

### Accessibility

#### Foundations need systematic completion

- **Current implementation:** Many controls are labelled and focusable, but some local controls lack consistent focus styles or item-specific names.
- **Handbook expectation:** Strong accessibility across authoring, preview, content, and mobile use.
- **Why it matters:** Repeated reorder and editing controls can be ambiguous.
- **Suggested priority:** **P0 audit; P1 remediation.** Define acceptance criteria before redesign.

#### Dialog behavior is incomplete

- **Current implementation:** Forms use modal semantics and autofocus, but no clear focus trap, Escape handling, or focus restoration is present.
- **Handbook expectation:** Predictable, confidence-building workflows.
- **Why it matters:** Keyboard and screen-reader users may lose context or move behind the dialog.
- **Suggested priority:** **P1.** Standardize one accessible dialog pattern.

#### Reordering is inconsistent

- **Current implementation:** Activities, Theory blocks, questions, and AI lists use different Up/Down controls; only some identify the item being moved.
- **Handbook expectation:** Activities and blocks are easy and predictable to reorder.
- **Why it matters:** Generic repeated controls are ambiguous and movement is not consistently announced.
- **Suggested priority:** **P1.** Create one keyboard-friendly pattern with item names and status announcements.

#### Destructive actions use browser confirmations

- **Current implementation:** Course, unit, lesson, and activity deletion rely on browser confirmation dialogs.
- **Handbook expectation:** Clear, consistent actions with understandable consequences.
- **Why it matters:** Native dialogs offer limited context and no product recovery model.
- **Suggested priority:** **P2.** Replace after defining a reusable accessible confirmation pattern.

## Obsolete Features

The following should eventually be replaced or hidden behind teacher-centered language. None should be removed before compatibility is proven.

### Separate Practice and Quiz Choices

Interactive Practice is the Handbook direction. Existing Practice and Quiz content must remain readable and editable during transition, while new authoring eventually converges on one activity with purposeful exercise formats.

### Empty Practice Creation

A Practice activity with no exercise authoring cannot fulfil its purpose. Replace it with usable Interactive Practice or temporarily remove it from new creation while preserving existing content.

### Raw Position Fields

Teachers should manipulate curriculum order directly rather than entering numeric positions.

### Technical Authoring Copy

References to schemas, JSON, subtype fields, stale rows, and asset internals should become safe, actionable teacher language.

### Permanent Preview Placeholder

The current disabled action is honest but should not survive as permanent redesign chrome.

### Browser-Native Confirmations

These should eventually give way to an accessible, consistent confirmation and recovery pattern.

### “Create Draft Version” as Primary Language

Version safety should remain while teacher-facing language emphasizes starting or improving a lesson draft.

## Missing Features

- Studio-specific UI Guidelines;
- central lesson objective and intended learner outcome;
- guided Draft → Review → Preview → Publish workflow;
- hierarchy and activity readiness summaries;
- shared validation catalogue with blockers, warnings, and recommendations;
- full student-perspective lesson preview;
- learner delivery of Studio-authored content;
- complete publisher review and publication workflow;
- complete teacher media workflow;
- unified Interactive Practice and reusable exercise formats;
- Vocabulary, Grammar in Context, and Reading Comprehension activities;
- cross-activity reusable Block System;
- complete type-specific Theory block configuration;
- block duplication and shared block library;
- optional official lesson templates and template customization;
- pedagogical activity chooser and sequence guidance;
- consistent accessible ordering, dialogs, and confirmation patterns;
- draft and review queues;
- collaborative authoring and review;
- AI-assisted creation and explainable recommendations;
- adaptive or personalized learning paths.

The final four items are medium- or long-term directions and should not delay the core authoring-to-publication loop.

## Future Features

The following features belong to the intentional long-term Studio roadmap. They should influence current product contracts without expanding the scope of the initial redesign.

### Structured Lesson Templates

Structured Lesson Templates are a future authoring system in which teachers begin with one official PronounceLab blueprint for the lesson type they want to create. The purpose is to reduce planning and structural work while preserving teacher control over educational content.

The product direction is:

- provide **one official template per lesson type**;
- avoid separate “simple,” “advanced,” or similarly competing versions;
- ask teachers to write the educational content rather than construct the lesson structure manually;
- generate the recommended activity and block structure automatically;
- create every imported or generated lesson as **Draft**;
- let teachers add audio, images, and other multimedia later inside the Studio;
- allow teachers to review and adapt the draft before publication;
- keep the generated structure aligned with the [Pedagogical Principles](PEDAGOGICAL_PRINCIPLES.md), [Activity System](ACTIVITY_SYSTEM.md), and [Block System](BLOCK_SYSTEM.md).

The initial template catalogue is:

1. Pronunciation Lesson
2. Listening Lesson
3. Reading Lesson
4. Grammar Lesson
5. Vocabulary Lesson
6. Speaking Lesson
7. Review Lesson
8. AI Speaking Lesson

Templates should create a useful starting point, not a sealed lesson. Teachers remain responsible for the learning objective, examples, instructions, practice content, and final review. The Studio supplies the official structure so teachers can focus on teaching.

This feature should **not** be implemented during the initial redesign. It depends on stable activity contracts, the reusable Block System, shared validation, safe draft creation, and a trustworthy preview workflow. The initial redesign should only preserve the product space and contracts needed for a later template system.

### Shared Content Libraries

Reusable blocks, activity patterns, and approved examples may eventually support responsible sharing. Ownership, provenance, update behavior, and teacher control must be defined before implementation.

### Collaborative Authoring

Review comments, handoffs, and shared editing are future goals. They depend on a clear Review stage, consistent conflict handling, and explicit responsibilities.

### AI-Assisted Authoring

AI may suggest starting points, examples, and variations, but teachers must remain in control. Assistance should be transparent, optional, and grounded in the lesson objective.

### Adaptive and Personalized Learning

Adaptive experiences and personalized paths are long-term directions. They require dependable learner evidence and should not influence the initial Studio redesign beyond preserving clear educational objectives and content structure.

## Recommended Sprint Plan

### Sprint 0 — Resolve Product Contracts

- **Goal:** Prevent redesign from hardening obsolete concepts.
- **Main deliverables:** Studio UI guidelines; Draft/Review/Preview/Publish definitions; Practice/Quiz transition decision; learning-objective and readiness contracts; existing-content inventory; usability and accessibility criteria.
- **Dependencies:** Handbook approval, canonical architecture review, teacher input.
- **Estimated complexity:** **Medium**.

### Sprint 1 — Teacher-Centered Workflow and Validation

- **Goal:** Make the current Studio easier to understand and complete without replacing its content model.
- **Main deliverables:** Teacher-friendly language; visible lesson objective; contextual readiness; blockers/warnings/recommendations; activity completion indicators; shared forms, status, dialogs, and ordering; accessibility remediation.
- **Dependencies:** Sprint 0 contracts.
- **Estimated complexity:** **Medium**.

### Sprint 2 — Truthful Preview and Published Delivery

- **Goal:** Establish one dependable representation of what students receive.
- **Main deliverables:** Approved content connected to learner delivery; full lesson preview from the same learner contract; responsive preview; unsupported-content checks; compatibility for existing learner content and progress.
- **Dependencies:** Published-content delivery foundation, stable learner contracts, media URL strategy.
- **Estimated complexity:** **High**.

### Sprint 3 — Review, Publishing, and Media

- **Goal:** Complete the journey from draft to student availability.
- **Main deliverables:** Review experience; grouped blockers; publisher handoff; deliberate publication action; complete trusted media workflow; clear post-publication improvement path.
- **Dependencies:** Sprints 1 and 2, trusted media workflow, existing publication safety.
- **Estimated complexity:** **High**.

### Sprint 4 — Activity System Convergence

- **Goal:** Align activities with the Handbook while preserving existing lessons.
- **Main deliverables:** Initial Interactive Practice exercise set; compatibility for Practice and Quiz; pedagogical chooser; incremental Vocabulary, Grammar in Context, and Reading Comprehension; readiness and preview for each type.
- **Dependencies:** Transition strategy, learner rendering, publication completeness, compatibility planning.
- **Estimated complexity:** **High**.
### Sprint 5 — Reusable Block System

- **Goal:** Deliver modular authoring without an overwhelming block catalogue.
- **Main deliverables:** Complete existing Theory blocks; minimal common lifecycle; type-specific configuration and preview; reorder, duplicate, and delete; justified common and specialist blocks; reuse and accessibility semantics.
- **Dependencies:** Stable activities, preview, media workflow, compatibility plan.
- **Estimated complexity:** **High**.

### Sprint 6 — Lesson Templates and Reuse

- **Goal:** Reduce planning time with optional pedagogical blueprints.
- **Main deliverables:** Objective-led template chooser; initial Pronunciation, Listening, and Speaking templates; safe customization and combination; later templates as activities mature; non-rigid readiness guidance.
- **Dependencies:** Stable Activity and Block Systems, duplication, shared validation.
- **Estimated complexity:** **Medium**.

### Sprint 7 — Assisted and Collaborative Authoring

- **Goal:** Extend teacher capability after the core workflow is trusted.
- **Main deliverables:** Shared libraries; collaborative review; transparent AI starting points; explainable recommendations; richer assessment and longer-term adaptive directions.
- **Dependencies:** Identity, ownership, provenance, privacy, review, validation, and version safety.
- **Estimated complexity:** **High**.

## Risks

### Content-Source Boundary

A preview built directly from current authoring forms could differ from what students receive. Preview and published delivery must share one truthful learner representation.

### Backward Compatibility

Replacing Practice and Quiz can make existing lessons unreadable or uneditable. Legacy content must remain supported until deliberately converted.

### Version and Publication Safety

Simpler teacher language must not weaken draft isolation, sealed releases, permission checks, or controlled publication.

### Media Workflow

Partial media support can produce lessons that appear ready to staff but fail for students. Media availability and publication must be verified end to end.

### Scope Expansion

Attempting activities, blocks, templates, collaboration, AI assistance, and adaptive learning in one redesign would delay the core authoring-to-publication loop.

### Pedagogical Rigidity

Templates and validation can become restrictive. Hard blockers should protect completion and safety; teaching-quality guidance should usually remain explainable and under teacher control.

### Accessibility Regression

Drag-and-drop ordering, custom dialogs, block choosers, and split preview layouts can reduce access if keyboard and assistive-technology behavior is added after visual design.

### Performance and Bundle Growth

Richer editors, preview, media, and AI assistance can inflate initial loading. Existing route and editor loading boundaries should be preserved.

### Error Handling

Current pages sometimes surface service errors directly. Expansion without a teacher-facing error model could expose technical details or provide inconsistent recovery.

### Concurrent Editing

Quiz and AI Mission handle stale saves more explicitly than other forms. Collaboration would amplify this inconsistency.

### Documentation Drift

The Handbook describes direction while canonical project documents describe current behavior. Each delivered phase must update current-state documentation and keep future claims labelled.

## Quick Wins

1. Replace schema, JSON, subtype, stale-row, and asset-internal wording with teacher-facing explanations and next steps.
2. Rename “Create draft version” to a teacher-centered action without changing its safety behavior.
3. Add item-specific accessible names to every activity, block, and question reorder control.
4. Announce reorder, duplication, deletion, and save results consistently.
5. Add editor empty states that explain the next useful action.
6. Surface dashboard “Needs attention” findings on the relevant hierarchy pages.
7. Add a compact lesson readiness summary from evidence already available.
8. Add concise educational descriptions to the current activity chooser.
9. Hide or clearly disable new Practice creation until meaningful exercise authoring exists, while preserving existing Practice content.
10. Standardize editors on existing shared forms, buttons, alerts, and statuses.
11. Add Escape handling, focus containment, and focus restoration to modal forms.
12. Add “why this matters” guidance beside existing validation and media requirements.
13. Label Theory's output as a block preview rather than complete student preview.
14. Create the missing Studio UI Guidelines before approving redesign mockups.
15. Run moderated teacher walkthroughs of course creation, lesson authoring, ordering, and review expectations.

Quick wins should not simulate publication, full preview, templates, or Interactive Practice before their contracts exist.

## Final Recommendation

PronounceLab Studio should evolve through compatible vertical improvements, not a one-time visual replacement. The current hierarchy, permissions, draft safety, responsive shell, specialist editors, and version protection are valuable assets.

First clarify the product contract: learning objectives, workflow stages, validation language, activity transition, accessibility criteria, and Studio-specific UI guidance. Next complete the truthful authoring-to-learner loop through shared preview, review readiness, publication, media, and published delivery. Only then should the team converge Practice and Quiz, expand official activities, generalize blocks, and introduce templates.

This order minimizes risk and preserves compatibility. Existing lessons can continue to work while new capabilities arrive behind clear, tested contracts. Success should be measured by whether teachers can move from a learning objective to a complete student experience with less effort, fewer surprises, and greater confidence.