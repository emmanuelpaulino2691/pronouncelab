import { courseRegistry } from "../../data/courseRegistry";
import type {
  LearnerCourse,
  LearnerCourseSummary,
} from "../contracts/learnerContent";
import {
  contentFailure,
  contentSuccess,
  type ContentResult,
} from "../errors/contentErrors";
import {
  mapStaticContent,
  staticRevision,
  type StaticContentSource,
  type StaticLearnerCatalog,
} from "../mappers/staticContentMapper";
import type { LearnerContentProvider } from "./LearnerContentProvider";

function courseSummary(
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

function copyResult<T>(value: T): T {
  // Keep the cached DTO graph private from accidental consumer mutation.
  return structuredClone(value);
}

async function requestCanContinue(
  signal?: AbortSignal
) {
  if (signal?.aborted) return false;
  await Promise.resolve();
  return !signal?.aborted;
}

function aborted<T>(): ContentResult<T> {
  return contentFailure(
    "aborted",
    "The content request was cancelled."
  );
}

function catalogFailure<T>(
  catalog: ContentResult<StaticLearnerCatalog>
): ContentResult<T> {
  if (catalog.ok) {
    return contentFailure(
      "unexpected",
      "Static content failed unexpectedly."
    );
  }

  return {
    ok: false,
    error: catalog.error,
  };
}

export function createStaticLearnerContentProvider(
  source: StaticContentSource = courseRegistry
): LearnerContentProvider {
  let catalog: ContentResult<StaticLearnerCatalog>;

  try {
    catalog = mapStaticContent(source);
  } catch {
    catalog = contentFailure(
      "invalid_data",
      "Static content could not be mapped safely."
    );
  }

  return {
    async listCourses(signal) {
      if (
        !(await requestCanContinue(signal))
      ) {
        return aborted();
      }
      if (!catalog.ok) {
        return catalogFailure(catalog);
      }

      return contentSuccess(
        copyResult(
          catalog.value.courses.map(
            courseSummary
          )
        ),
        staticRevision
      );
    },

    async getCourse(id, signal) {
      if (
        !(await requestCanContinue(signal))
      ) {
        return aborted();
      }
      if (!catalog.ok) {
        return catalogFailure(catalog);
      }

      const course =
        catalog.value.coursesById.get(id);

      return course
        ? contentSuccess(
            copyResult(course),
            staticRevision
          )
        : contentFailure(
            "not_found",
            "Course not found."
          );
    },

    async listUnits(courseId, signal) {
      if (
        !(await requestCanContinue(signal))
      ) {
        return aborted();
      }
      if (!catalog.ok) {
        return catalogFailure(catalog);
      }

      const course =
        catalog.value.coursesById.get(
          courseId
        );

      return course
        ? contentSuccess(
            copyResult(course.units),
            staticRevision
          )
        : contentFailure(
            "not_found",
            "Course not found."
          );
    },

    async getUnit(id, signal) {
      if (
        !(await requestCanContinue(signal))
      ) {
        return aborted();
      }
      if (!catalog.ok) {
        return catalogFailure(catalog);
      }

      const unit =
        catalog.value.unitsById.get(id);

      return unit
        ? contentSuccess(
            copyResult(unit),
            staticRevision
          )
        : contentFailure(
            "not_found",
            "Unit not found."
          );
    },

    async listLessons(unitId, signal) {
      if (
        !(await requestCanContinue(signal))
      ) {
        return aborted();
      }
      if (!catalog.ok) {
        return catalogFailure(catalog);
      }

      const unit =
        catalog.value.unitsById.get(unitId);

      return unit
        ? contentSuccess(
            copyResult(unit.lessons),
            staticRevision
          )
        : contentFailure(
            "not_found",
            "Unit not found."
          );
    },

    async getLesson(id, signal) {
      if (
        !(await requestCanContinue(signal))
      ) {
        return aborted();
      }
      if (!catalog.ok) {
        return catalogFailure(catalog);
      }

      const lesson =
        catalog.value.lessonsById.get(id);

      if (lesson) {
        return contentSuccess(
          copyResult(lesson),
          staticRevision
        );
      }

      const summary =
        catalog.value.lessonSummariesById.get(
          id
        );

      return summary
        ? contentFailure(
            "unavailable",
            "Lesson content is not available yet."
          )
        : contentFailure(
            "not_found",
            "Lesson not found."
          );
    },
  };
}

export const staticLearnerContentProvider =
  createStaticLearnerContentProvider();
