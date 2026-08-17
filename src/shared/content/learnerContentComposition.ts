import type { ContentSource } from "./contracts/learnerContent";
import type { LearnerContentProvider } from "./providers/LearnerContentProvider";
import { staticLearnerContentProvider } from "./providers/staticLearnerContentProvider";
import { createLearnerApiService } from "./api/LearnerApiService";
import type { LearnerApiService } from "./api/LearnerApiService";
import { sdkLearnerSupabaseGateway } from "./gateways/sdkLearnerSupabaseGateway";
import { createSupabaseLearnerContentProvider } from "./providers/supabaseLearnerContentProvider";

export const learnerContentSource =
  "supabase" satisfies ContentSource;

// Published Supabase projections are the active learner source. The local
// provider remains available only for focused compatibility tests.
export const learnerApiService =
  createLearnerApiService(
    sdkLearnerSupabaseGateway
  );

export function composeLearnerContentProvider(
  source: ContentSource,
  api: LearnerApiService = learnerApiService
): LearnerContentProvider {
  switch (source) {
    case "local":
      return staticLearnerContentProvider;
    case "supabase":
      return createSupabaseLearnerContentProvider(
        api
      );
  }
}

export const learnerContentProvider:
  LearnerContentProvider =
  composeLearnerContentProvider(
    learnerContentSource
  );
