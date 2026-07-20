import type {
  PublishedCatalogRpcEnvelope,
  PublishedRpcActivity,
  PublishedRpcMedia,
  PublishedRpcQuestion,
  PublishedRpcTheoryBlock,
} from "../contracts/publishedRpc";
import {
  isPublishedCatalogRpcEnvelope,
  isPublishedLessonRpcEnvelope,
} from "../contracts/publishedRpcGuards";
import type {
  LearnerActivity,
  LearnerMedia,
  LearnerQuestion,
  LearnerTheoryBlock,
} from "../contracts/learnerActivities";
import type {
  ContentId,
  LearnerCourse,
  LearnerCourseSummary,
  LearnerLesson,
  LearnerLessonSummary,
  LearnerUnit,
  LearnerUnitSummary,
} from "../contracts/learnerContent";
import {
  contentFailure,
  contentSuccess,
  type ContentResult,
} from "../errors/contentErrors";

export type PublishedLearnerCatalog = {
  readonly courses: readonly LearnerCourse[];
  readonly coursesById: ReadonlyMap<
    ContentId,
    LearnerCourse
  >;
  readonly unitsById: ReadonlyMap<
    ContentId,
    LearnerUnit
  >;
  readonly lessonsById: ReadonlyMap<
    ContentId,
    LearnerLessonSummary
  >;
};

const contentId = (value: string) =>
  value as ContentId;

function compareIds(left: string, right: string) {
  return (
    left.length - right.length ||
    left.localeCompare(right)
  );
}

function ordered<T extends {
  position: number;
  id: string;
}>(values: readonly T[]) {
  return [...values].sort(
    (left, right) =>
      left.position - right.position ||
      compareIds(left.id, right.id)
  );
}

function mapMedia(
  media: PublishedRpcMedia | null
): LearnerMedia | null {
  // Phase 2C must resolve this public bucket/object path against the configured
  // Supabase Storage origin before the provider is activated in learner routes.
  return media
    ? {
        id: contentId(media.id),
        kind: media.kind,
        url: media.publicPath,
        mimeType: media.mimeType,
        altText: media.altText,
      }
    : null;
}

function mapQuestion(
  question: PublishedRpcQuestion
): LearnerQuestion {
  return {
    id: contentId(question.id),
    prompt: question.prompt,
    position: question.position,
    required: question.required,
    options: ordered(question.options).map(
      (option) => ({
        id: contentId(option.id),
        text: option.text,
        position: option.position,
      })
    ),
  };
}

function mapTheoryBlock(
  block: PublishedRpcTheoryBlock
): LearnerTheoryBlock {
  switch (block.type) {
    case "heading":
      return { ...block };
    case "paragraph":
    case "tip":
      return { ...block };
    case "example":
      return { ...block };
    case "image":
      return {
        type: "image",
        media: mapMedia(block.media)!,
        alt: block.alt,
      };
    case "audio":
      return {
        type: "audio",
        media: mapMedia(block.media)!,
      };
  }
}

function mapActivity(
  activity: PublishedRpcActivity
): LearnerActivity {
  const base = {
    id: contentId(activity.id),
    title: activity.title,
    position: activity.position,
    required: activity.required,
  };

  switch (activity.type) {
    case "theory":
      return {
        ...base,
        type: "theory",
        blocks: activity.blocks.map(
          mapTheoryBlock
        ),
      };
    case "listening":
      return {
        ...base,
        type: "listening",
        items: ordered(activity.items).map(
          (item) => ({
            id: contentId(item.id),
            title: item.title,
            instructions: item.instructions,
            transcript: item.transcript,
            audio: mapMedia(item.audio),
            questions: ordered(
              item.questions
            ).map(mapQuestion),
          })
        ),
      };
    case "pronunciation":
      return {
        ...base,
        type: "pronunciation",
        items: ordered(activity.items).map(
          (item) => ({
            id: contentId(item.id),
            title: item.title,
            instructions: item.instructions,
            displayText: item.displayText,
            audio: mapMedia(item.audio),
          })
        ),
      };
    case "practice":
      return {
        ...base,
        type: "practice",
        delivery: "metadata-only",
        items: ordered(activity.items).map(
          (item) => ({
            id: contentId(item.id),
            title: item.title,
            instructions: item.instructions,
          })
        ),
      };
    case "quiz":
      return {
        ...base,
        type: "quiz",
        scoring: "deferred",
        assessments: ordered(
          activity.assessments
        ).map(
          (assessment) => ({
            id: contentId(assessment.id),
            title: assessment.title,
            questions: ordered(
              assessment.questions
            ).map(mapQuestion),
          })
        ),
      };
    case "ai_speaking_mission":
      return {
        ...base,
        type: "ai_speaking_mission",
        missionId: contentId(
          activity.missionId
        ),
        config: structuredClone(
          activity.config
        ),
      };
  }
}

function mapCatalogEnvelope(
  envelope: PublishedCatalogRpcEnvelope
): PublishedLearnerCatalog {
  const coursesById = new Map<
    ContentId,
    LearnerCourse
  >();
  const unitsById = new Map<
    ContentId,
    LearnerUnit
  >();
  const lessonsById = new Map<
    ContentId,
    LearnerLessonSummary
  >();

  const courses = ordered(envelope.courses).map(
    (course): LearnerCourse => {
      const units = ordered(course.units).map(
        (unit): LearnerUnitSummary => {
          const lessons = ordered(
            unit.lessons
          ).map(
            (
              lesson
            ): LearnerLessonSummary => {
              const mapped = {
                id: contentId(lesson.id),
                unitId: contentId(
                  lesson.unitId
                ),
                title: lesson.title,
                description: lesson.description,
                position: lesson.position,
                currentVersionId: contentId(
                  lesson.currentVersionId
                ),
                activityCount:
                  lesson.activityCount,
                available: true,
              };
              lessonsById.set(
                mapped.id,
                mapped
              );
              return mapped;
            }
          );
          const mapped: LearnerUnit = {
            id: contentId(unit.id),
            courseId: contentId(
              unit.courseId
            ),
            title: unit.title,
            description: unit.description,
            position: unit.position,
            lessonCount: lessons.length,
            lessons,
          };
          unitsById.set(mapped.id, mapped);
          return mapped;
        }
      );
      const mapped: LearnerCourse = {
        id: contentId(course.id),
        slug: course.slug,
        title: course.title,
        description: course.description,
        level: course.level,
        emoji: course.emoji,
        position: course.position,
        unitCount: units.length,
        units,
      };
      coursesById.set(mapped.id, mapped);
      return mapped;
    }
  );

  return {
    courses,
    coursesById,
    unitsById,
    lessonsById,
  };
}

function hasValidCatalogIdentity(
  envelope: PublishedCatalogRpcEnvelope
) {
  const courseIds = new Set<string>();
  const unitIds = new Set<string>();
  const lessonIds = new Set<string>();

  for (const course of envelope.courses) {
    if (courseIds.has(course.id)) return false;
    courseIds.add(course.id);

    for (const unit of course.units) {
      if (
        unit.courseId !== course.id ||
        unitIds.has(unit.id)
      ) {
        return false;
      }
      unitIds.add(unit.id);

      for (const lesson of unit.lessons) {
        if (
          lesson.unitId !== unit.id ||
          lessonIds.has(lesson.id)
        ) {
          return false;
        }
        lessonIds.add(lesson.id);
      }
    }
  }
  return true;
}

export function mapPublishedCatalog(
  value: unknown
): ContentResult<PublishedLearnerCatalog> {
  if (
    !isPublishedCatalogRpcEnvelope(value) ||
    !hasValidCatalogIdentity(value)
  ) {
    return contentFailure(
      "invalid_data",
      "Published catalog data is invalid."
    );
  }
  return contentSuccess(
    mapCatalogEnvelope(value),
    value.catalogRevision
  );
}

export function mapPublishedLesson(
  value: unknown
): ContentResult<LearnerLesson> {
  if (!isPublishedLessonRpcEnvelope(value)) {
    return contentFailure(
      "invalid_data",
      "Published lesson data is invalid."
    );
  }
  if (value.lesson === null) {
    return contentFailure(
      "not_found",
      "Published lesson not found."
    );
  }

  return contentSuccess(
    {
      id: contentId(value.lesson.id),
      unitId: contentId(value.lesson.unitId),
      courseId: contentId(
        value.lesson.courseId
      ),
      title: value.lesson.title,
      description: value.lesson.description,
      metadata: {
        source: "supabase",
        lessonId: contentId(value.lesson.id),
        lessonVersionId: contentId(
          value.lesson.currentVersionId
        ),
        versionNumber:
          value.lesson.versionNumber,
        publishedAt: value.lesson.publishedAt,
        schemaVersion: 1,
      },
      activities: ordered(
        value.lesson.activities
      ).map(mapActivity),
    },
    value.lessonRevision
  );
}

export function courseSummaryFromPublished(
  course: LearnerCourse
): LearnerCourseSummary {
  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.description,
    level: course.level,
    emoji: course.emoji,
    position: course.position,
    unitCount: course.unitCount,
  };
}
