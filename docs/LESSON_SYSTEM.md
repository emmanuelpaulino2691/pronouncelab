# Lesson System

## Contents

- [Two representations](#two-representations)
- [Concept hierarchy](#concept-hierarchy)
- [Activity types](#activity-types)
- [Lesson Studio](#lesson-studio)
- [Learner rendering](#learner-rendering)
- [Authoring invariants](#authoring-invariants)
- [Adding an activity type](#adding-an-activity-type)

## Two representations

PronounceLab currently has two lesson representations:

1. `src/shared/types/LessonData.ts` and static fixtures drive learner routes.
2. Supabase `lessons` → `lesson_versions` → `lesson_activities` and subtype tables drive Lesson Studio.

They are conceptually aligned but there is no implemented projection from published Supabase versions into learner `LessonData`. Never assume matching IDs or automatic delivery.

## Concept hierarchy

- **Course**: curriculum root.
- **Unit**: ordered course section.
- **Lesson**: ordered teaching unit and stable catalog identity.
- **Lesson version**: mutable draft or sealed release of one lesson.
- **Activity**: ordered metadata (`type`, title, required, position) in a version.
- **Subtype content**: theory blocks, listening/pronunciation items, assessment/questions/options, or AI mission configuration.
- **Renderer**: learner component selected by activity type.
- **Editor**: staff component selected by Studio activity type.

## Activity types

| Type | Admin model/editor | Learner model/renderer |
| --- | --- | --- |
| `theory` | Ordered `theory_blocks`: heading, paragraph, tip, example, image, audio | Theory block content |
| `listening` | `listening_items`: title, instructions, optional manual transcript, and managed audio reference | Listening exercises from static data |
| `pronunciation` | Ordered `pronunciation_items`: backward-compatible display-text items or pronunciation-specific `word_list` / `minimal_pairs` blocks with structured entries and optional audio | Legacy word/phrase practice plus responsive Word List and Minimal Pairs presentation |
| `practice` | Activity metadata only in the current Studio; no dedicated database subtype | Static practice exercise data |
| `quiz` | `assessment_sets`, questions, and answer options | Static quiz interactions |
| `ai_speaking_mission` | One JSON configuration row per activity | Structured external-AI mission card |

The student static models can be richer than the current admin subtype schema. For example, static theory/practice types are not a direct serialization of `theory_blocks`.

Word List and Minimal Pairs deliberately extend the pronunciation subtype
rather than introducing a universal block table. New block mutations use
parent-scoped RPCs, while legacy pronunciation rows remain readable and
editable. This focused model provides a migration seam for a future Universal
Block System without claiming that the generic system exists today.

## Lesson Studio

Route:

```text
/admin/courses/:courseId/units/:unitId/lessons/:lessonId/studio
```

The page verifies the compound course → unit → lesson relationship and clears old hierarchy state before route loads. It ignores stale asynchronous results.

The shell contains:

- hierarchy breadcrumbs and lesson/version status;
- activity timeline and selection;
- create, duplicate, reorder, and delete actions for editable drafts;
- shared metadata form;
- type-specific editor panel;
- read-only state for publisher-only or sealed content;
- disabled preview placeholder.

### Save behavior

Forms use explicit saves rather than per-keystroke autosave. They reset when activity selection changes, prevent double submission, and only apply a pending result when it still belongs to the selected activity. Simple updates request the authoritative saved row; zero-row updates are errors.

Quiz question saves are atomic and use the loaded `updated_at` as an optimistic concurrency token. A conflict rejects the stale save and reloads authoritative content.

## Learner rendering

The ordered `LessonData.activities` list is the learner source of truth. `ActivityRenderer` uses `activityRegistry` to select:

- `TheoryActivity`
- `ListeningActivity`
- `PronunciationActivity`
- `PracticeActivity`
- `QuizActivity`
- `AiSpeakingMissionActivity`

Renderers receive the full lesson because subtype content is stored in separate arrays. The Lesson Player also provides a readiness callback for interactions that should be completed before continuing.

See [Student Experience](STUDENT_EXPERIENCE.md).

## Authoring invariants

- Only a fully draft course → unit → lesson → version hierarchy is editable.
- Publishers can view but not edit drafts.
- Activity create/duplicate/reorder operations use parent-scoped RPCs.
- Existing rows cannot change parent foreign keys.
- Reorder operations require an exact permutation scoped to the expected parent.
- Published or archived descendants cannot be changed or deleted.
- Lifecycle status is not an ordinary metadata field.
- Authoring and publication share a hierarchy gate.

Database detail is in [Database](DATABASE.md).

## Adding an activity type

An activity type is cross-cutting. A complete change normally includes:

1. a forward-only enum/schema migration;
2. subtype constraints and RLS;
3. atomic create/duplicate support;
4. publication completeness validation;
5. Studio type union, label/icon map, service, editor, and read-only behavior;
6. learner `LessonActivityType`, subtype data shape, registry mapping, and renderer;
7. static fixture compatibility until learner delivery moves to Supabase;
8. documentation and validation.

Do not add only an enum value. That can create activities without the subtype data their editor and renderer require.
