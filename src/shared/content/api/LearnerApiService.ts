import {
  isPublishedCatalogRpcEnvelope,
  isPublishedLessonRpcEnvelope,
  isPublishedRpcErrorEnvelope,
} from "../contracts/publishedRpcGuards";
import type {
  DecimalContentId,
  PublishedCatalogRpcEnvelope,
  PublishedLessonRpcEnvelope,
} from "../contracts/publishedRpc";
import type { LearnerSupabaseGateway } from "../gateways/LearnerSupabaseGateway";
import {
  infrastructureFailure,
  type LearnerInfrastructureResult,
} from "../infrastructure/learnerInfrastructureErrors";

export interface LearnerApiService {
  getPublishedLearningCatalog(
    signal?: AbortSignal
  ): Promise<
    LearnerInfrastructureResult<PublishedCatalogRpcEnvelope>
  >;

  getPublishedLesson(
    lessonId: DecimalContentId,
    signal?: AbortSignal
  ): Promise<
    LearnerInfrastructureResult<PublishedLessonRpcEnvelope>
  >;
}

export function createLearnerApiService(
  gateway: LearnerSupabaseGateway
): LearnerApiService {
  return {
    async getPublishedLearningCatalog(signal) {
      let result;
      try {
        result =
          await gateway.getPublishedLearningCatalog(
            signal
          );
      } catch {
        return infrastructureFailure(
          signal?.aborted
            ? "aborted"
            : "unexpected",
          signal?.aborted
            ? "The learner content request was cancelled."
            : "Published learner content could not be loaded."
        );
      }
      if (!result.ok) return result;
      if (isPublishedRpcErrorEnvelope(result.value)) {
        return infrastructureFailure(
          "invalid_response",
          "The published catalog schema version is unsupported."
        );
      }
      if (
        !isPublishedCatalogRpcEnvelope(
          result.value
        )
      ) {
        return infrastructureFailure(
          "invalid_response",
          "The published catalog response is invalid."
        );
      }
      return {
        ok: true,
        value: result.value,
      };
    },

    async getPublishedLesson(lessonId, signal) {
      let result;
      try {
        result =
          await gateway.getPublishedLesson(
            lessonId,
            signal
          );
      } catch {
        return infrastructureFailure(
          signal?.aborted
            ? "aborted"
            : "unexpected",
          signal?.aborted
            ? "The learner content request was cancelled."
            : "Published learner content could not be loaded."
        );
      }
      if (!result.ok) return result;
      if (isPublishedRpcErrorEnvelope(result.value)) {
        return infrastructureFailure(
          "invalid_response",
          "The published lesson schema version is unsupported."
        );
      }
      if (
        !isPublishedLessonRpcEnvelope(
          result.value
        )
      ) {
        return infrastructureFailure(
          "invalid_response",
          "The published lesson response is invalid."
        );
      }
      if (result.value.lesson === null) {
        return infrastructureFailure(
          "not_found",
          "Published lesson not found."
        );
      }
      return {
        ok: true,
        value: result.value,
      };
    },
  };
}
