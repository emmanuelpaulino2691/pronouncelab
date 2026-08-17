# PronounceLab Block System

## Version

| Field | Value |
| --- | --- |
| Version | 1.0 |
| Status | Official product direction; full reusable block system is future |
| Last Updated | July 22, 2026 |

## Contents

- [Purpose](#purpose)
- [Design Philosophy](#design-philosophy)
- [Activities vs Blocks](#activities-vs-blocks)
- [Block Principles](#block-principles)
- [Block Lifecycle](#block-lifecycle)
- [Common Block Categories](#common-block-categories)
- [Activity-Specific Blocks](#activity-specific-blocks)
- [Choosing Blocks](#choosing-blocks)
- [Future Evolution](#future-evolution)
- [Conclusion](#conclusion)

## Purpose

Blocks are reusable building units used to construct activities. They give teachers a clear way to combine instructions, media, learning content, practice, and assessment without treating a lesson as one long document.

Activities define the educational experience. Blocks define the content that supports that experience. Together, they create complete learning experiences in which the learner's action and the material needed for that action remain clearly connected.

This document defines the official product direction for a Studio-wide Block System. The complete reusable model described here is **Future** and should not be represented as currently available across every activity until the canonical project documentation confirms it.

## Design Philosophy

Teachers should build lessons by combining small, reusable blocks instead of editing long, unstructured documents. Modular authoring makes content easier to understand, arrange, review, and improve.

Every block should have a single responsibility. A block may explain an idea, present an example, play media, guide practice, or ask for a response, but it should not become a collection of unrelated purposes.

Blocks should reduce duplication while keeping lessons easy to understand. Reuse should save teacher effort and promote consistency without making every lesson feel identical. Teachers should remain free to select and arrange the content that best serves their learning objective.

## Activities vs Blocks

Activities and blocks work together, but they represent different concepts.

An activity answers:

> What is the student expected to do?

A block answers:

> What content is needed to support that learning experience?

For example, a Listening activity asks the student to listen with a purpose. Audio, instructions, a transcript, and reflection prompts may support that experience as blocks. The activity gives those elements a shared educational direction; the blocks provide the material needed to carry it out.

An activity should not be defined only by the content it contains. A block should not decide the full learning experience by itself. Keeping these responsibilities separate helps teachers create lessons that are both flexible and coherent.

## Block Principles

- **One responsibility per block.** Each block should perform one clear content or learning-support role.
- **Blocks should be reusable.** Teachers should be able to apply useful block patterns across suitable lessons and activities.
- **Blocks should be easy to recognize.** A teacher should understand a block's purpose before adding it.
- **Blocks should be easy to reorder.** Teachers should be able to improve the learning flow without rebuilding content.
- **Blocks should remain independent.** A block should avoid hidden reliance on unrelated content around it.
- **Simplicity over unnecessary options.** Blocks should offer only the choices needed to fulfil their educational role.
- **Every block should provide educational value.** A block earns its place by helping the learner understand, practise, communicate, or reflect.

## Block Lifecycle

The intended block lifecycle follows a simple authoring flow:

```text
Add Block
↓
Configure Block
↓
Preview
↓
Edit
↓
Reorder
↓
Duplicate (optional)
↓
Delete
```

### Add Block

The teacher selects a block because the activity needs a specific kind of content or support. The choice should begin with the learning objective, not with a desire to fill space.

### Configure Block

The teacher adds the content and makes the few choices needed for the block's purpose. The Studio should keep this step focused and use language that teachers understand.

### Preview

The teacher checks how the block contributes to the student experience. Preview should make clarity, pacing, and context easier to judge before publication.

**Future:** Complete preview across the Block System is part of the intended product experience.

### Edit

The teacher improves the block as the lesson develops. Editing should feel safe and direct so that refinement remains a normal part of authoring.

### Reorder

The teacher moves the block when a different sequence creates a clearer learning flow. Reordering should support experimentation without requiring content to be recreated.

### Duplicate (Optional)

The teacher may duplicate a suitable block when its structure or content provides a useful starting point. Duplication should reduce repeated work, followed by deliberate review so that copied content remains appropriate.

### Delete

The teacher removes a block when it no longer supports the activity. Deletion should be understandable and deliberate, especially when the block contains substantial work.

## Common Block Categories

Block categories help teachers find the right kind of support without requiring them to understand a long list of unrelated options. These categories describe product direction rather than a guarantee that every example is currently available.

### Instruction Blocks

Instruction blocks explain the purpose of a task or guide the learner's attention.

Examples include:

- instructions;
- objectives;
- tips.

They should be concise, actionable, and appropriate for the learner's level. Instruction blocks prepare action rather than replace it with lengthy explanation.

### Media Blocks

Media blocks provide visual or spoken material that supports observation, modelling, context, or comprehension.

Examples include:

- audio;
- image;
- video;
- illustration.

Media should have a clear educational role. It should not be added only for decoration, and teachers should consider whether students can understand the activity when a particular medium is unavailable or unsuitable.

### Learning Content Blocks

Learning content blocks present the language, concept, or text that students need to understand.

Examples include:

- explanation;
- example;
- vocabulary list;
- grammar pattern;
- reading text.

These blocks should keep information focused and connect it to later practice. They are most useful when students know what to notice and how the content supports the lesson goal.

### Practice Blocks

Practice blocks give learners structured opportunities to use or reflect on language.

Examples include:

- word list;
- sentence practice;
- minimal pairs;
- dialogue;
- reflection.

Practice should move beyond repetition when the learning goal allows it. Blocks should help learners progress from supported action toward more independent communication.

### Assessment Blocks

Assessment blocks help learners and teachers check understanding through focused responses.

Examples include:

- questions;
- multiple choice;
- matching;
- fill in the blanks.

Assessment blocks may appear inside Interactive Practice and other future activities when they serve the activity's educational objective. They should provide useful evidence of learning rather than add testing for its own sake. The exact exercise formats are outside the scope of this document.

## Activity-Specific Blocks

Some blocks are generic and can support several activity types. Others belong only to a particular learning experience because their purpose depends on that activity.

A Pronunciation activity may include:

- Sound Model;
- Minimal Pair Table;
- Pronunciation Practice.

A Listening activity may include:

- Audio Player;
- Transcript.

An AI Speaking Mission may include:

- Mission Prompt;
- Reflection.

Activity-specific blocks should exist only when they provide unique educational value that a common block cannot express clearly. A specialized name or appearance is not enough. The block should make the teacher's choice easier and the student's experience more purposeful.

## Choosing Blocks

Teachers should select only the blocks that contribute directly to the learning objective and the role of the activity. Each block should help answer what the learner needs to notice, understand, practise, or communicate.

Adding unnecessary blocks increases cognitive load for both teachers and students. It can weaken the lesson sequence, hide the main goal, and make review more difficult. Simple lessons are often stronger than overly complex lessons because each part has a visible reason to exist.

## Future Evolution

New block types may be introduced as PronounceLab grows and genuine teaching needs become clear. Every proposed block must:

- solve a real instructional need;
- have a unique responsibility;
- remain easy for teachers to understand;
- avoid duplicating an existing block.

A new presentation style or minor option does not automatically justify a new block type. The Block System should expand carefully so that flexibility grows without turning authoring into a search through unnecessary choices.

## Conclusion

The Block System gives teachers flexibility without sacrificing consistency. It provides small, purposeful building units that can be combined into clear activities and complete learning experiences.

Blocks should make lesson creation feel creative, organized, and enjoyable rather than technical. Their success should be measured by how naturally they help teachers turn educational intent into meaningful student action.