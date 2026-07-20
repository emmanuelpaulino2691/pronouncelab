import type { ContentSource } from "./contracts/learnerContent";
import type { LearnerContentProvider } from "./providers/LearnerContentProvider";
import { staticLearnerContentProvider } from "./providers/staticLearnerContentProvider";
import { createLearnerApiService } from "./api/LearnerApiService";
import type { LearnerApiService } from "./api/LearnerApiService";
import { sdkLearnerSupabaseGateway } from "./gateways/sdkLearnerSupabaseGateway";
import { createSupabaseLearnerContentProvider } from "./providers/supabaseLearnerContentProvider";

export const learnerContentSource =
  "local" satisfies ContentSource;

// Prepared for explicit Supabase provider construction; the default remains
// local until the learner route migration phase.
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
