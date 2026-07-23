import {
  validateAiSpeakingMission,
} from "../../../features/ai-missions";
import type { CourseData } from "../../types/CourseData";
import type { LessonData } from "../../types/LessonData";
import type { LessonSummary } from "../../types/LessonSummary";
import type { MultipleChoiceQuestion } from "../../types/MultipleChoiceQuestion";
import type { TheoryBlock } from "../../types/TheoryBlock";
import type { UnitData } from "../../types/UnitData";
import type {
  LearnerActivity,
  LearnerMedia,
  LearnerQuestion,
  LearnerTheoryBlock,
} from "../contracts/learnerActivities";
import {
  contentIdFromStaticNumber,
  type ContentId,
  type LearnerCourse,
  type LearnerCourseSummary,
  type LearnerLesson,
  type LearnerLessonSummary,
  type LearnerUnit,
  type LearnerUnitSummary,
} from "../contracts/learnerContent";
import {
  contentFailure,
  contentSuccess,
  type ContentResult,
} from "../errors/contentErrors";

export type StaticContentSource = {
  courses: readonly CourseData[];
  units: readonly UnitData[];
  lessons: readonly LessonSummary[];
  lessonData: Readonly<Record<number, LessonData>>;
};

export type StaticLearnerCatalog = {
  courses: LearnerCourse[];
  coursesById: ReadonlyMap<ContentId, LearnerCourse>;
  unitsById: ReadonlyMap<ContentId, LearnerUnit>;
  lessonSummariesById: ReadonlyMap<
    ContentId,
    LearnerLessonSummary
  >;
  lessonsById: ReadonlyMap<ContentId, LearnerLesson>;
};

const staticRevision = "local-fixtures-v1";

function invalid<T>(
  message: string
): ContentResult<T> {
  return contentFailure(
    "invalid_data",
    message
  );
}

function requiredId(
  value: number,
  label: string
): ContentResult<ContentId> {
  const id = contentIdFromStaticNumber(value);

  return id
    ? contentSuccess(id, staticRevision)
    : invalid(
        `${label} must use a nonnegative safe integer ID.`
      );
}

function derivedId(...parts: Array<string | number>) {
  return parts.join(":") as ContentId;
}

function cleanRequiredText(
  value: unknown,
  label: string
): ContentResult<string> {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return invalid(`${label} is required.`);
  }

  return contentSuccess(
    value.trim(),
    staticRevision
  );
}

function optionalText(value: unknown) {
  return typeof value === "string" &&
    value.trim()
    ? value.trim()
    : null;
}

function mediaFromStaticUrl(
  activityId: ContentId,
  itemId: ContentId,
  kind: "audio" | "image",
  url: unknown,
  altText: string | null = null
): ContentResult<LearnerMedia | null> {
  if (url === undefined || url === null || url === "") {
    return contentSuccess(null, staticRevision);
  }

  if (typeof url !== "string") {
    return invalid(
      `Static ${kind} URL must be text.`
    );
  }

  return contentSuccess(
    {
      id: derivedId(
        "local-media",
        activityId,
        itemId,
        kind
      ),
      kind,
      url,
      mimeType: null,
      altText,
    },
    staticRevision
  );
}

function mapQuestion(
  question: MultipleChoiceQuestion,
  position: number,
  context: string
): ContentResult<LearnerQuestion> {
  const questionId = requiredId(
    question.id,
    `${context} question`
  );
  const prompt = cleanRequiredText(
    question.question,
    `${context} question prompt`
  );

  if (!questionId.ok) return questionId;
  if (!prompt.ok) return prompt;

  if (
    !Array.isArray(question.options) ||
    question.options.length < 2
  ) {
    return invalid(
      `${context} question ${question.id} requires at least two options.`
    );
  }

  const options = [];

  for (
    let optionPosition = 0;
    optionPosition < question.options.length;
    optionPosition += 1
  ) {
    const text = cleanRequiredText(
      question.options[optionPosition],
      `${context} question option`
    );

    if (!text.ok) return text;

    options.push({
      id: derivedId(
        "local-option",
        questionId.value,
        optionPosition
      ),
      text: text.value,
      position: optionPosition,
    });
  }

  return contentSuccess(
    {
      id: questionId.value,
      prompt: prompt.value,
      position,
      required: true,
      options,
    },
    staticRevision
  );
}

function mapTheoryBlock(
  block: TheoryBlock,
  activityId: ContentId,
  position: number
): ContentResult<LearnerTheoryBlock> {
  const blockId = derivedId(
    "local-theory",
    activityId,
    position
  );

  switch (block.type) {
    case "heading": {
      const text = cleanRequiredText(
        block.text,
        "Theory heading"
      );
      if (!text.ok) return text;

      return contentSuccess(
        {
          type: "heading",
          level: block.level ?? 2,
          text: text.value,
        },
        staticRevision
      );
    }
    case "paragraph":
    case "tip": {
      const text = cleanRequiredText(
        block.text,
        `Theory ${block.type}`
      );
      if (!text.ok) return text;

      return contentSuccess(
        {
          type: block.type,
          text: text.value,
        },
        staticRevision
      );
    }
    case "example": {
      const title = cleanRequiredText(
        block.title,
        "Theory example title"
      );
      const text = cleanRequiredText(
        block.text,
        "Theory example text"
      );
      if (!title.ok) return title;
      if (!text.ok) return text;

      return contentSuccess(
        {
          type: "example",
          title: title.value,
          text: text.value,
        },
        staticRevision
      );
    }
    case "image": {
      const media = mediaFromStaticUrl(
        activityId,
        blockId,
        "image",
        block.src,
        block.alt
      );
      if (!media.ok) return media;
      if (!media.value) {
        return invalid(
          "Theory image requires a source."
        );
      }

      return contentSuccess(
        {
          type: "image",
          media: media.value,
          alt: block.alt,
        },
        staticRevision
      );
    }
    case "audio": {
      const media = mediaFromStaticUrl(
        activityId,
        blockId,
        "audio",
        block.src
      );
      if (!media.ok) return media;
      if (!media.value) {
        return invalid(
          "Theory audio requires a source."
        );
      }

      return contentSuccess(
        {
          type: "audio",
          media: media.value,
        },
        staticRevision
      );
    }
  }
}

function mapActivities(
  lesson: LessonData
): ContentResult<LearnerActivity[]> {
  if (!Array.isArray(lesson.activities)) {
    return invalid(
      `Lesson ${lesson.id} activities must be an array.`
    );
  }

  const activityIds = new Set<string>();
  const singularTypes = new Set<string>();
  const activities: LearnerActivity[] = [];

  for (
    let position = 0;
    position < lesson.activities.length;
    position += 1
  ) {
    const activity = lesson.activities[position];
    const id = requiredId(
      activity.id,
      `Lesson ${lesson.id} activity`
    );
    const title = cleanRequiredText(
      activity.title,
      `Lesson ${lesson.id} activity title`
    );

    if (!id.ok) return id;
    if (!title.ok) return title;
    if (activityIds.has(id.value)) {
      return invalid(
        `Lesson ${lesson.id} has duplicate activity ID ${activity.id}.`
      );
    }
    activityIds.add(id.value);

    const base = {
      id: id.value,
      title: title.value,
      position,
      required: true,
    };

    switch (activity.type as string) {
      case "theory": {
        if (singularTypes.has("theory")) {
          return invalid(
            `Lesson ${lesson.id} has ambiguous theory activities.`
          );
        }
        singularTypes.add("theory");

        if (
          !Array.isArray(lesson.theory) ||
          lesson.theory.length === 0
        ) {
          return invalid(
            `Lesson ${lesson.id} theory content is missing.`
          );
        }

        const blocks: LearnerTheoryBlock[] = [];
        for (
          let blockPosition = 0;
          blockPosition < lesson.theory.length;
          blockPosition += 1
        ) {
          const block = mapTheoryBlock(
            lesson.theory[blockPosition],
            id.value,
            blockPosition
          );
          if (!block.ok) return block;
          blocks.push(block.value);
        }

        activities.push({
          ...base,
          type: "theory",
          blocks,
        });
        break;
      }
      case "listening": {
        if (singularTypes.has("listening")) {
          return invalid(
            `Lesson ${lesson.id} has ambiguous listening activities.`
          );
        }
        singularTypes.add("listening");

        if (
          !Array.isArray(lesson.listening) ||
          lesson.listening.length === 0
        ) {
          return invalid(
            `Lesson ${lesson.id} listening content is missing.`
          );
        }

        const items = [];
        for (
          let itemPosition = 0;
          itemPosition < lesson.listening.length;
          itemPosition += 1
        ) {
          const item =
            lesson.listening[itemPosition];
          const itemId = requiredId(
            item.id,
            "Listening item"
          );
          const itemTitle = cleanRequiredText(
            item.title,
            "Listening item title"
          );
          if (!itemId.ok) return itemId;
          if (!itemTitle.ok) return itemTitle;

          const audio = mediaFromStaticUrl(
            id.value,
            itemId.value,
            "audio",
            item.audio
          );
          if (!audio.ok) return audio;

          const questions: LearnerQuestion[] = [];
          for (
            let questionPosition = 0;
            questionPosition <
            (item.questions?.length ?? 0);
            questionPosition += 1
          ) {
            const question = mapQuestion(
              item.questions![questionPosition],
              questionPosition,
              "Listening"
            );
            if (!question.ok) return question;
            questions.push(question.value);
          }

          items.push({
            id: itemId.value,
            title: itemTitle.value,
            instructions: optionalText(
              item.instructions
            ),
            transcript: optionalText(
              item.transcript
            ),
            audio: audio.value,
            questions,
          });
        }

        activities.push({
          ...base,
          type: "listening",
          items,
        });
        break;
      }
      case "pronunciation": {
        if (singularTypes.has("pronunciation")) {
          return invalid(
            `Lesson ${lesson.id} has ambiguous pronunciation activities.`
          );
        }
        singularTypes.add("pronunciation");

        if (
          !Array.isArray(lesson.pronunciation) ||
          lesson.pronunciation.length === 0
        ) {
          return invalid(
            `Lesson ${lesson.id} pronunciation content is missing.`
          );
        }

        const items = [];
        for (const item of lesson.pronunciation) {
          const itemId = requiredId(
            item.id,
            "Pronunciation item"
          );
          const itemTitle = cleanRequiredText(
            item.title,
            "Pronunciation item title"
          );
          if (!itemId.ok) return itemId;
          if (!itemTitle.ok) return itemTitle;

          const displayText = "blockType" in item
            ? { ok: true as const, value: "" }
            : cleanRequiredText(item.text, "Pronunciation display text");
          if (!displayText.ok) return displayText;

          const audio = mediaFromStaticUrl(
            id.value,
            itemId.value,
            "audio",
            item.audio
          );
          if (!audio.ok) return audio;

          items.push({
            id: itemId.value,
            title: itemTitle.value,
            instructions: null,
            displayText: displayText.value,
            ...("blockType" in item ? {
              blockType: item.blockType,
              spellingPattern: item.spellingPattern ?? null,
              entries: structuredClone(item.entries),
            } : {}),
            audio: audio.value,
          });
        }

        activities.push({
          ...base,
          type: "pronunciation",
          items,
        });
        break;
      }
      case "practice": {
        if (singularTypes.has("practice")) {
          return invalid(
            `Lesson ${lesson.id} has ambiguous practice activities.`
          );
        }
        singularTypes.add("practice");

        if (
          !Array.isArray(lesson.practice) ||
          lesson.practice.length === 0
        ) {
          return invalid(
            `Lesson ${lesson.id} practice metadata is missing.`
          );
        }

        const items = [];
        for (const item of lesson.practice) {
          const itemId = requiredId(
            item.id,
            "Practice item"
          );
          const itemTitle = cleanRequiredText(
            item.title,
            "Practice item title"
          );
          if (!itemId.ok) return itemId;
          if (!itemTitle.ok) return itemTitle;

          items.push({
            id: itemId.value,
            title: itemTitle.value,
            instructions: optionalText(
              item.instructions
            ),
          });
        }

        activities.push({
          ...base,
          type: "practice",
          delivery: "metadata-only",
          items,
        });
        break;
      }
      case "quiz": {
        if (singularTypes.has("quiz")) {
          return invalid(
            `Lesson ${lesson.id} has ambiguous quiz activities.`
          );
        }
        singularTypes.add("quiz");

        if (
          !Array.isArray(lesson.quiz) ||
          lesson.quiz.length === 0
        ) {
          return invalid(
            `Lesson ${lesson.id} quiz content is missing.`
          );
        }

        const assessments = [];
        for (const quiz of lesson.quiz) {
          const quizId = requiredId(
            quiz.id,
            "Quiz"
          );
          const quizTitle = cleanRequiredText(
            quiz.title,
            "Quiz title"
          );
          if (!quizId.ok) return quizId;
          if (!quizTitle.ok) return quizTitle;

          const questions: LearnerQuestion[] = [];
          if (
            Array.isArray(
              quiz.interactiveQuestions
            ) &&
            quiz.interactiveQuestions.length > 0
          ) {
            for (
              let questionPosition = 0;
              questionPosition <
              quiz.interactiveQuestions.length;
              questionPosition += 1
            ) {
              const question = mapQuestion(
                quiz.interactiveQuestions[
                  questionPosition
                ],
                questionPosition,
                "Quiz"
              );
              if (!question.ok) return question;
              questions.push(question.value);
            }
          } else {
            for (
              let questionPosition = 0;
              questionPosition <
              quiz.questions.length;
              questionPosition += 1
            ) {
              const prompt = cleanRequiredText(
                quiz.questions[questionPosition],
                "Quiz prompt"
              );
              if (!prompt.ok) return prompt;

              questions.push({
                id: derivedId(
                  "local-quiz-question",
                  quizId.value,
                  questionPosition
                ),
                prompt: prompt.value,
                position: questionPosition,
                required: true,
                options: [],
              });
            }
          }

          assessments.push({
            id: quizId.value,
            title: quizTitle.value,
            questions,
          });
        }

        activities.push({
          ...base,
          type: "quiz",
          scoring: "deferred",
          assessments,
        });
        break;
      }
      case "ai_speaking_mission": {
        const missions =
          lesson.aiMissions?.filter(
            (item) =>
              item.activityId === activity.id
          ) ?? [];
        const mission = missions[0];

        if (missions.length !== 1 || !mission) {
          return invalid(
            `Lesson ${lesson.id} AI Speaking Mission ${activity.id} requires exactly one configuration.`
          );
        }

        const config = validateAiSpeakingMission(
          mission
        );
        if (!config.ok) {
          return invalid(config.error);
        }

        activities.push({
          ...base,
          type: "ai_speaking_mission",
          missionId: derivedId(
            "local-mission",
            lesson.id,
            activity.id
          ),
          config: config.value,
        });
        break;
      }
      default:
        return invalid(
          `Lesson ${lesson.id} uses unsupported activity type "${String(activity.type)}".`
        );
    }
  }

  return contentSuccess(
    activities,
    staticRevision
  );
}

function mapLesson(
  summary: LessonSummary,
  lesson: LessonData,
  unitId: ContentId,
  courseId: ContentId
): ContentResult<LearnerLesson> {
  const lessonId = requiredId(
    summary.id,
    "Lesson"
  );
  const title = cleanRequiredText(
    lesson.title,
    "Lesson title"
  );
  const description = cleanRequiredText(
    lesson.description,
    "Lesson description"
  );

  if (!lessonId.ok) return lessonId;
  if (!title.ok) return title;
  if (!description.ok) return description;
  if (lesson.id !== summary.id) {
    return invalid(
      `Lesson data ${lesson.id} does not match summary ${summary.id}.`
    );
  }

  const activities = mapActivities(lesson);
  if (!activities.ok) return activities;

  return contentSuccess(
    {
      id: lessonId.value,
      unitId,
      courseId,
      title: title.value,
      description: description.value,
      metadata: {
        source: "local",
        lessonId: lessonId.value,
        fixtureRevision: "1",
      },
      activities: activities.value,
    },
    staticRevision
  );
}

export function mapStaticContent(
  source: StaticContentSource
): ContentResult<StaticLearnerCatalog> {
  if (
    !Array.isArray(source.courses) ||
    !Array.isArray(source.units) ||
    !Array.isArray(source.lessons)
  ) {
    return invalid(
      "Static content collections are malformed."
    );
  }

  const courseRows = new Map<number, CourseData>();
  const unitRows = new Map<number, UnitData>();
  const lessonRows = new Map<
    number,
    LessonSummary
  >();

  for (const course of source.courses) {
    if (courseRows.has(course.id)) {
      return invalid(
        `Duplicate static course ID ${course.id}.`
      );
    }
    courseRows.set(course.id, course);
  }

  for (const unit of source.units) {
    if (unitRows.has(unit.id)) {
      return invalid(
        `Duplicate static unit ID ${unit.id}.`
      );
    }
    unitRows.set(unit.id, unit);
  }

  for (const lesson of source.lessons) {
    if (lessonRows.has(lesson.id)) {
      return invalid(
        `Duplicate static lesson ID ${lesson.id}.`
      );
    }
    lessonRows.set(lesson.id, lesson);
  }

  const courses: LearnerCourse[] = [];
  const coursesById =
    new Map<ContentId, LearnerCourse>();
  const unitsById =
    new Map<ContentId, LearnerUnit>();
  const lessonSummariesById =
    new Map<ContentId, LearnerLessonSummary>();
  const lessonsById =
    new Map<ContentId, LearnerLesson>();

  for (
    let coursePosition = 0;
    coursePosition < source.courses.length;
    coursePosition += 1
  ) {
    const course = source.courses[coursePosition];
    const courseId = requiredId(
      course.id,
      "Course"
    );
    const courseTitle = cleanRequiredText(
      course.title,
      "Course title"
    );
    if (!courseId.ok) return courseId;
    if (!courseTitle.ok) return courseTitle;

    const units: LearnerUnit[] = [];
    const referencedUnitIds = new Set<number>();

    for (
      let unitPosition = 0;
      unitPosition < course.units.length;
      unitPosition += 1
    ) {
      const numericUnitId =
        course.units[unitPosition];
      if (referencedUnitIds.has(numericUnitId)) {
        return invalid(
          `Course ${course.id} contains duplicate unit reference ${numericUnitId}.`
        );
      }
      referencedUnitIds.add(numericUnitId);
      const unit = unitRows.get(numericUnitId);

      if (
        !unit ||
        unit.courseId !== course.id
      ) {
        return invalid(
          `Course ${course.id} references missing or mismatched unit ${numericUnitId}.`
        );
      }

      const unitId = requiredId(
        unit.id,
        "Unit"
      );
      const unitTitle = cleanRequiredText(
        unit.title,
        "Unit title"
      );
      if (!unitId.ok) return unitId;
      if (!unitTitle.ok) return unitTitle;

      const lessons: LearnerLessonSummary[] = [];
      const referencedLessonIds =
        new Set<number>();

      for (
        let lessonPosition = 0;
        lessonPosition < unit.lessons.length;
        lessonPosition += 1
      ) {
        const numericLessonId =
          unit.lessons[lessonPosition];
        if (
          referencedLessonIds.has(
            numericLessonId
          )
        ) {
          return invalid(
            `Unit ${unit.id} contains duplicate lesson reference ${numericLessonId}.`
          );
        }
        referencedLessonIds.add(
          numericLessonId
        );
        const summary =
          lessonRows.get(numericLessonId);

        if (
          !summary ||
          summary.unitId !== unit.id
        ) {
          return invalid(
            `Unit ${unit.id} references missing or mismatched lesson ${numericLessonId}.`
          );
        }

        const lessonId = requiredId(
          summary.id,
          "Lesson"
        );
        const summaryTitle = cleanRequiredText(
          summary.title,
          "Lesson summary title"
        );
        if (!lessonId.ok) return lessonId;
        if (!summaryTitle.ok) return summaryTitle;

        const lessonData =
          source.lessonData[
            summary.lessonDataId
          ];
        let mappedLesson:
          | LearnerLesson
          | undefined;

        if (lessonData) {
          const result = mapLesson(
            summary,
            lessonData,
            unitId.value,
            courseId.value
          );
          if (!result.ok) return result;
          mappedLesson = result.value;
          lessonsById.set(
            lessonId.value,
            mappedLesson
          );
        }

        const lessonSummary: LearnerLessonSummary =
          {
            id: lessonId.value,
            unitId: unitId.value,
            title: summaryTitle.value,
            description:
              optionalText(
                summary.description
              ) ?? "",
            position: lessonPosition,
            currentVersionId: null,
            activityCount:
              mappedLesson?.activities.length ??
              0,
            available: Boolean(mappedLesson),
          };

        lessons.push(lessonSummary);
        lessonSummariesById.set(
          lessonId.value,
          lessonSummary
        );
      }

      const unitSummary: LearnerUnitSummary = {
        id: unitId.value,
        courseId: courseId.value,
        title: unitTitle.value,
        description:
          optionalText(unit.description) ?? "",
        position: unitPosition,
        lessonCount: lessons.length,
      };
      const learnerUnit: LearnerUnit = {
        ...unitSummary,
        lessons,
      };

      units.push(learnerUnit);
      unitsById.set(
        unitId.value,
        learnerUnit
      );
    }

    const courseSummary: LearnerCourseSummary = {
      id: courseId.value,
      slug: `local-course-${courseId.value}`,
      title: courseTitle.value,
      description:
        optionalText(course.description) ?? "",
      level: optionalText(course.level) ?? "",
      emoji: optionalText(course.emoji) ?? "",
      position: coursePosition,
      unitCount: units.length,
    };
    const learnerCourse: LearnerCourse = {
      ...courseSummary,
      units,
    };

    courses.push(learnerCourse);
    coursesById.set(
      courseId.value,
      learnerCourse
    );
  }

  return contentSuccess(
    {
      courses,
      coursesById,
      unitsById,
      lessonSummariesById,
      lessonsById,
    },
    staticRevision
  );
}

export { staticRevision };
