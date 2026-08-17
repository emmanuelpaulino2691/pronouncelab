# PronounceLab Validation Rules

## Version

| Field | Value |
| --- | --- |
| Version | 1.0 |
| Status | Official product direction; complete validation framework is future |
| Last Updated | July 22, 2026 |

## Contents

- [Purpose](#purpose)
- [Design Philosophy](#design-philosophy)
- [Validation Principles](#validation-principles)
- [Validation Levels](#validation-levels)
- [Draft vs Publish](#draft-vs-publish)
- [Validation Messages](#validation-messages)
- [Teacher Experience](#teacher-experience)
- [Future Evolution](#future-evolution)
- [Conclusion](#conclusion)

## Purpose

Validation helps teachers create complete, consistent, and high-quality learning experiences before publication. Its purpose is not simply to prevent errors. It should help teachers notice missing content, unclear learning paths, and gaps that may affect students.

Good validation protects the educational intention of a course, unit, lesson, or activity while allowing teachers to work creatively. This document defines the product direction for a complete Studio validation framework. Not every rule described here is currently available and the framework should not be represented as fully implemented until the canonical project documentation confirms it.

## Design Philosophy

Validation is educational guidance. The Studio should explain what is missing, why it matters to the learning experience, and what the teacher can do next. A message that only reports failure does not provide enough support.

Validation should increase confidence before publishing. Teachers should be able to review their work, understand its readiness, and resolve important issues without searching for hidden requirements. Guidance should remain proportionate: firm when a complete student experience is at risk and flexible when professional judgment should decide.

## Validation Principles

- **Validate only what matters.** A rule should protect learning quality, clarity, or completeness.
- **Prefer guidance over restriction.** Help teachers improve their work before preventing an action.
- **Messages should be clear and actionable.** Teachers should know what needs attention and what to do next.
- **Validation should be predictable.** Similar situations should receive consistent guidance across the Studio.
- **Prevent incomplete learning experiences.** Publication should not expose students to missing essential content or an activity they cannot complete.
- **Reduce teacher frustration.** Show relevant guidance at a useful time and avoid unnecessary interruptions during creative work.

## Validation Levels

Validation follows the educational hierarchy. Each level checks whether it can fulfil its responsibility within the complete learning journey.

### Course Validation

A course should provide a clear and organized learning direction. Before publication, teachers should confirm that:

- a clear title exists;
- the course description is complete;
- the course contains at least one unit.

These checks help students understand what the course offers and ensure that the course leads to actual learning content.

### Unit Validation

A unit should represent a meaningful stage within the course. Before publication, teachers should confirm that:

- a clear title exists;
- the unit contains lessons.

A unit without lessons cannot guide students through a learning stage. Its title should also communicate a useful focus rather than act only as an internal label.

### Lesson Validation

A lesson should provide a focused and complete learning experience. Before publication, teachers should confirm that:

- a clear title exists;
- the lesson contains activities;
- the learning objective is complete;
- the activity sequence can provide a meaningful learning experience.

The final check requires educational judgment. A lesson may contain activities and still be incomplete if students receive no clear input, useful practice, or path toward the objective.

### Activity Validation

Each activity should be validated according to its educational purpose. Validation should confirm that the student can perform the expected action, not that every activity contains the same kind or amount of content.

#### Theory

A Theory activity should contain the explanation or examples needed to introduce its concept. Students should not be asked to learn from an empty heading or an unsupported statement.

#### Listening

A Listening activity should include audio that students can listen to for the stated purpose. Instructions or supporting context should make the listening goal clear.

#### Pronunciation

A Pronunciation activity should contain the pronunciation content needed for guided listening, comparison, repetition, or speaking practice. The student should have a clear model and a meaningful target.

#### Vocabulary

A Vocabulary activity should contain useful vocabulary in enough context for students to understand and practise it.

#### Grammar in Context

A Grammar in Context activity should contain a clear explanation or examples showing how the pattern supports communication.

#### Interactive Practice

An Interactive Practice activity should contain at least one purposeful exercise. The exercise should connect to the lesson objective and provide a clear action for the student.

#### Reading Comprehension

A Reading Comprehension activity should contain a reading text and a clear reason for students to read it.

#### AI Speaking Mission

An AI Speaking Mission should contain clear mission instructions and a complete prompt. Students should understand the speaking goal, what they are expected to do, and how the mission connects to the lesson.

Vocabulary, Grammar in Context, Interactive Practice, and Reading Comprehension are part of the future activity direction described in the [Activity System](ACTIVITY_SYSTEM.md). Their inclusion here defines the intended validation standard, not current availability.

## Draft vs Publish

Draft mode allows experimentation. Teachers should be able to add ideas, rearrange content, leave work incomplete, and return later without constant interruption. Draft guidance may identify gaps while still allowing the creative process to continue.

Publishing requires greater confidence. Before students receive a lesson, validation should confirm that essential content is present and that the learning experience is complete enough to fulfil its purpose. Rules therefore become stricter at publication, when unresolved issues could directly affect students.

This distinction follows a simple principle:

```text
Draft → Guide improvement
Publish → Confirm readiness
```

Validation should not turn drafting into premature publication review. It should provide the right level of support for the teacher's current stage.

## Validation Messages

A useful validation message should:

- explain the issue;
- explain why it matters;
- suggest the next step.

For example, “Add audio so students can complete this listening activity” is more useful than “Invalid activity.” It identifies what is missing, connects the issue to the learner experience, and gives the teacher a clear action.

Messages should use familiar educational language, identify the relevant course, unit, lesson, activity, or block, and avoid generic statements such as “Something went wrong.” When several issues exist, they should be organized so that teachers can resolve them without feeling overwhelmed.

## Teacher Experience

Validation should feel like a helpful assistant rather than a strict reviewer. It should notice important gaps, communicate calmly, and help teachers move forward with confidence.

The Studio should encourage improvement rather than punishment. Messages should respect teacher expertise, avoid blame, and distinguish essential requirements from recommendations. Teachers should always understand whether an issue prevents publication or simply suggests a stronger learning experience.

## Future Evolution

Validation rules may evolve as new activities, blocks, and lesson patterns are introduced. Experience with real teaching workflows may also reveal where guidance should become clearer, lighter, or more focused.

Every validation rule should improve lesson quality without adding unnecessary complexity. A new rule should have a clear educational reason, address a meaningful risk, and remain easy for teachers to understand. Rules that create work without protecting learning should be reconsidered.

## Conclusion

Validation exists to protect student learning while helping teachers feel confident when publishing their work. It succeeds when teachers understand what makes an experience complete, can resolve important gaps easily, and reach publication with trust in the lesson they have created.