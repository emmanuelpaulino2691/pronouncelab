import type { LearnerApiService } from "../api/LearnerApiService";
import type { DecimalContentId } from "../contracts/publishedRpc";
import { isDecimalContentId } from "../contracts/publishedRpcGuards";
import {
  contentFailure,
  contentSuccess,
  type ContentResult,
} from "../errors/contentErrors";
import type { LearnerInfrastructureError } from "../infrastructure/learnerInfrastructureErrors";
import {
  courseSummaryFromPublished,
  mapPublishedCatalog,
  mapPublishedLesson,
} from "../mappers/publishedContentMapper";
import type { PublishedLearnerCatalog } from "../mappers/publishedContentMapper";
import type { LearnerContentProvider } from "./LearnerContentProvider";

function copyResult<T>(value: T): T {
  return structuredClone(value);
}

function infrastructureError<T>(
  error: LearnerInfrastructureError
): ContentResult<T> {
  switch (error.code) {
    case "not_found":
      return contentFailure(
        "not_found",
        "Published content not found."
      );
    case "aborted":
      return contentFailure(
        "aborted",
        "The content request was cancelled."
      );
    case "invalid_response":
      return contentFailure(
        "invalid_data",
        "Published content data is invalid."
      );
    case "unavailable":
    case "unauthorized":
    case "forbidden":
      return contentFailure(
        "unavailable",
        "Published content is unavailable.",
        error.retryable
      );
    case "unexpected":
      return contentFailure(
        "unexpected",
        "Published content could not be loaded.",
        error.retryable
      );
  }
}

async function catalog(
  api: LearnerApiService,
  signal?: AbortSignal
): Promise<
  ContentResult<PublishedLearnerCatalog>
> {
  const result =
    await api.getPublishedLearningCatalog(
      signal
    );
  return result.ok
    ? mapPublishedCatalog(result.value)
    : infrastructureError<PublishedLearnerCatalog>(
        result.error
      );
}

export function createSupabaseLearnerContentProvider(
  api: LearnerApiService
): LearnerContentProvider {
  return {
    async listCourses(signal) {
      const result = await catalog(api, signal);
      if (!result.ok) return result;
      return contentSuccess(
        copyResult(
          result.value.courses.map(
            courseSummaryFromPublished
          )
        ),
        result.revision
      );
    },

    async getCourse(id, signal) {
      const result = await catalog(api, signal);
      if (!result.ok) return result;
      const course =
        result.value.coursesById.get(id);
      return course
        ? contentSuccess(
            copyResult(course),
            result.revision
          )
        : contentFailure(
            "not_found",
            "Course not found."
          );
    },

    async listUnits(courseId, signal) {
      const result = await catalog(api, signal);
      if (!result.ok) return result;
      const course =
        result.value.coursesById.get(
          courseId
        );
      return course
        ? contentSuccess(
            copyResult(course.units),
            result.revision
          )
        : contentFailure(
            "not_found",
            "Course not found."
          );
    },

    async getUnit(id, signal) {
      const result = await catalog(api, signal);
      if (!result.ok) return result;
      const unit = result.value.unitsById.get(id);
      return unit
        ? contentSuccess(
            copyResult(unit),
            result.revision
          )
        : contentFailure(
            "not_found",
            "Unit not found."
          );
    },

    async listLessons(unitId, signal) {
      const result = await catalog(api, signal);
      if (!result.ok) return result;
      const unit =
        result.value.unitsById.get(unitId);
      return unit
        ? contentSuccess(
            copyResult(unit.lessons),
            result.revision
          )
        : contentFailure(
            "not_found",
            "Unit not found."
          );
    },

    async getLesson(id, signal) {
      if (!isDecimalContentId(id)) {
        return contentFailure(
          "not_found",
          "Published lesson not found."
        );
      }
      const result =
        await api.getPublishedLesson(
          id as DecimalContentId,
          signal
        );
      if (!result.ok) {
        return infrastructureError(result.error);
      }
      const mapped = mapPublishedLesson(
        result.value
      );
      if (
        mapped.ok &&
        mapped.value.id !== id
      ) {
        return contentFailure(
          "invalid_data",
          "Published lesson data does not match the requested lesson."
        );
      }
      return mapped.ok
        ? contentSuccess(
            copyResult(mapped.value),
            mapped.revision
          )
        : mapped;
    },
  };
}
