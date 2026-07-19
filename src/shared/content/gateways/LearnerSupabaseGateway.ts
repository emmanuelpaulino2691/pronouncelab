import type { DecimalContentId } from "../contracts/publishedRpc";
import type { LearnerInfrastructureResult } from "../infrastructure/learnerInfrastructureErrors";

export interface LearnerSupabaseGateway {
  getPublishedLearningCatalog(
    signal?: AbortSignal
  ): Promise<LearnerInfrastructureResult<unknown>>;

  getPublishedLesson(
    lessonId: DecimalContentId,
    signal?: AbortSignal
  ): Promise<LearnerInfrastructureResult<unknown>>;
}
