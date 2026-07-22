# PronounceLab Activity System

## Version

| Field | Value |
| --- | --- |
| Version | 1.0 |
| Status | Official product direction; includes future activity types |
| Last Updated | July 22, 2026 |

## Contents

- [Purpose](#purpose)
- [Design Philosophy](#design-philosophy)
- [Activity Principles](#activity-principles)
- [Official Activity Types](#official-activity-types)
- [Activity Progression](#activity-progression)
- [Choosing Activities](#choosing-activities)
- [Future Activities](#future-activities)
- [Conclusion](#conclusion)

## Purpose

Activities are the building blocks of every PronounceLab lesson. Each activity gives the learner one clear educational objective and one understandable reason to participate.

Activities should remain focused, predictable, and easy for teachers to understand. This document defines the official product design direction for the activity system. Some activity types and the unified Interactive Practice model are **Future** and should not be represented as currently available until the canonical project documentation confirms their delivery.

## Design Philosophy

Activities represent learning experiences, not content containers. Their value comes from what students notice, practise, understand, or communicate while completing them.

A lesson becomes meaningful by combining activities with different educational purposes. The sequence should help learners move from initial understanding toward increasingly independent language use. Every activity should answer one question:

> What is the student expected to do here?

If the expected learner action is unclear, the activity needs a stronger purpose or a simpler design.

## Activity Principles

- **One educational purpose per activity.** Each activity should have a primary learning objective that teachers and students can recognize.
- **Activities should be reusable.** A useful activity pattern should work across different topics, levels, and lesson contexts.
- **Activities should be easy to recognize.** Teachers should understand what an activity is for before adding it to a lesson.
- **Activities should support communication.** Even focused language work should contribute to meaningful understanding or expression.
- **Activities should encourage active learning.** Students should listen, notice, choose, respond, practise, create, or reflect rather than only consume information.
- **Simplicity is preferred over feature overload.** An activity should include only the capabilities needed to achieve its educational purpose.

## Official Activity Types

The following types define the intended PronounceLab activity system. They describe distinct educational roles rather than mandatory stages in every lesson.

### Theory

**Purpose:** Introduce a new concept clearly and prepare students for practice.

**Learning Goal:** Students understand the central idea, pattern, or distinction well enough to recognize and apply it.

**Typical Student Experience:** The student reads or observes a concise explanation, studies selected examples, and notices the feature that will appear in later activities.

**Typical Teacher Use:** The teacher introduces only the information needed for the lesson, selects helpful examples, and connects the explanation to an immediate learner action.

### Listening

**Purpose:** Develop listening comprehension through authentic or instructional audio.

**Learning Goal:** Students identify meaning, details, patterns, or contrasts in spoken English with growing confidence.

**Typical Student Experience:** The student listens with a clear purpose, may replay the audio, notices relevant language, and responds to a focused task.

**Typical Teacher Use:** The teacher chooses level-appropriate audio, gives a reason to listen, and guides attention without revealing every answer before the learner engages.

### Pronunciation

**Purpose:** Develop pronunciation through guided listening, repetition, comparison, and speaking practice.

**Learning Goal:** Students hear relevant sound patterns and produce clearer, more confident speech in words, phrases, and communication.

**Typical Student Experience:** The student listens to models, notices spelling and sound patterns, compares examples, repeats useful language, and applies the target in speech.

**Typical Teacher Use:** The teacher selects meaningful contrasts and a progression from recognition to production. For beginner learners, teaching should rely on words, examples, patterns, and repeated exposure rather than requiring International Phonetic Alphabet symbols.

### Vocabulary

**Purpose:** Introduce and practise useful vocabulary in context.

**Learning Goal:** Students understand selected words or phrases and can use them appropriately in meaningful situations.

**Typical Student Experience:** The student meets vocabulary through examples or a situation, connects form with meaning, and uses the language in guided and independent practice.

**Typical Teacher Use:** The teacher selects relevant, high-value language, provides enough context, and creates opportunities for retrieval and communication rather than presenting long isolated lists.

**Future:** Vocabulary is part of the official product direction but is not a distinct current Studio activity type.

### Grammar in Context

**Purpose:** Present grammar as a tool for communication instead of a collection of isolated rules.

**Learning Goal:** Students notice how a grammatical pattern expresses meaning and use it to communicate more clearly.

**Typical Student Experience:** The student observes the pattern in context, compares examples, practises supported choices, and applies the structure to a meaningful message.

**Typical Teacher Use:** The teacher begins with communicative purpose, explains only what learners need, and moves quickly from observation to use.

**Future:** Grammar in Context is part of the official product direction but is not a distinct current Studio activity type.

### Interactive Practice

**Purpose:** Give students one consistent place to check understanding, strengthen recognition, and apply learning through interaction.

**Learning Goal:** Students respond actively to focused tasks, receive useful guidance, and become more prepared for independent communication.

**Typical Student Experience:** The student completes a sequence of short exercises that may involve multiple choice, matching, fill in the blanks, sound discrimination, ordering, sentence completion, listening exercises, or pronunciation recognition.

**Typical Teacher Use:** The teacher chooses exercise formats according to the learning objective, combines related practice into a coherent activity, and avoids adding interactions that do not improve learning.

Interactive Practice is the intended unified practice activity. It replaces the traditional product separation between Practice and Quiz while allowing different exercise formats to serve different goals within one recognizable activity type. The specific exercise formats are not defined in this document.

**Future:** The unified Interactive Practice model is a product direction. Current experiences continue to use the activity types documented in the canonical [Lesson System](../LESSON_SYSTEM.md) until a dedicated product change replaces them.

### Reading Comprehension

**Purpose:** Develop reading strategies while reinforcing vocabulary, grammar, and comprehension.

**Learning Goal:** Students understand a suitable text, identify relevant meaning and detail, and connect the text with the lesson's wider communication goal.

**Typical Student Experience:** The student reads with a purpose, uses context to understand language, responds to focused prompts, and may reflect on or discuss the text.

**Typical Teacher Use:** The teacher selects an appropriate text, sets a clear reading purpose, and designs tasks that support comprehension rather than testing every sentence.

**Future:** Reading Comprehension is part of the official product direction but is not a distinct current Studio activity type.

### AI Speaking Mission

**Purpose:** Provide guided speaking practice through an external AI voice experience.

**Learning Goal:** Students use lesson language in extended communication, practise speaking more independently, and identify a useful next step.

**Typical Student Experience:** The student follows a clear mission, speaks with an external AI tool, and treats the resulting feedback as supportive guidance rather than an authoritative assessment.

**Typical Teacher Use:** The teacher defines a focused, level-appropriate speaking goal and connects the mission to earlier lesson practice. AI extends opportunities for communication; it does not replace teacher feedback, judgment, or classroom interaction.

## Activity Progression

Lessons normally move from understanding toward communication. A broad progression may be:

```text
Theory
↓
Listening
↓
Pronunciation
↓
Vocabulary
↓
Grammar in Context
↓
Interactive Practice
↓
Reading Comprehension (optional)
↓
AI Speaking Mission
```

This progression is a teaching guide, not a required template. Teachers may reorder, repeat, combine, or omit stages according to the learning objective, learner level, and context. The important direction is from clear input and guided support toward active, meaningful language use.

## Choosing Activities

Teachers should choose activities by starting with the learning objective: what should students understand, practise, or communicate by the end of the lesson? Each selected activity should make a necessary contribution to that outcome.

A lesson does not need every available activity. Adding an activity without a clear purpose increases length and cognitive load without improving learning. Quality is more important than quantity, and a short, coherent sequence is better than a crowded lesson with repeated or disconnected tasks.

## Future Activities

New activity types may be added as PronounceLab grows. Expansion should remain deliberate. Every proposed activity must:

- solve a real educational problem;
- have a unique learning purpose;
- be unsuitable for clear representation by an existing activity;
- keep the Studio simple for teachers.

A new format alone does not require a new activity type. The educational role must be distinct enough to justify another concept in the authoring experience.

## Conclusion

Activities define what students experience during a lesson. They turn teaching goals into actions that learners can understand and complete.

A well-designed lesson is not the one with the most activities. It is the one in which every activity has a clear educational purpose and each step helps the learner move toward meaningful communication.