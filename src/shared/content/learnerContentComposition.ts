import type { ContentSource } from "./contracts/learnerContent";
import type { LearnerContentProvider } from "./providers/LearnerContentProvider";
import { staticLearnerContentProvider } from "./providers/staticLearnerContentProvider";
import { createLearnerApiService } from "./api/LearnerApiService";
import { sdkLearnerSupabaseGateway } from "./gateways/sdkLearnerSupabaseGateway";

export const learnerContentSource =
  "local" satisfies ContentSource;

function composeLearnerContentProvider(
  source: ContentSource
): LearnerContentProvider {
  switch (source) {
    case "local":
      return staticLearnerContentProvider;
    case "supabase":
      throw new Error(
        "The Supabase learner content provider is not implemented."
      );
  }
}

export const learnerContentProvider:
  LearnerContentProvider =
  composeLearnerContentProvider(
    learnerContentSource
  );

// Prepared for the later Supabase provider phase; it is not connected to
// learnerContentProvider or learner routes in Phase 2A.
export const learnerApiService =
  createLearnerApiService(
    sdkLearnerSupabaseGateway
  );
