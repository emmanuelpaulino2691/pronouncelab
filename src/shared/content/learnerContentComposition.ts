import type { ContentSource } from "./contracts/learnerContent";
import type { LearnerContentProvider } from "./providers/LearnerContentProvider";
import { staticLearnerContentProvider } from "./providers/staticLearnerContentProvider";

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
