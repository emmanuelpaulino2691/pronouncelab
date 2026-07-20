import { describe, expect, it } from "vitest";

import {
  composeLearnerContentProvider,
  learnerContentProvider,
  learnerContentSource,
} from "./learnerContentComposition";
import { staticLearnerContentProvider } from "./providers/staticLearnerContentProvider";
import type { LearnerApiService } from "./api/LearnerApiService";

describe("learner content composition", () => {
  it("keeps the local static provider active", () => {
    expect(learnerContentSource).toBe("local");
    expect(learnerContentProvider).toBe(
      staticLearnerContentProvider
    );
  });

  it("constructs local and Supabase providers explicitly without changing the default", () => {
    const fakeApi = {} as LearnerApiService;
    expect(
      composeLearnerContentProvider(
        "local",
        fakeApi
      )
    ).toBe(staticLearnerContentProvider);
    expect(
      composeLearnerContentProvider(
        "supabase",
        fakeApi
      )
    ).not.toBe(staticLearnerContentProvider);
    expect(learnerContentSource).toBe("local");
    expect(learnerContentProvider).toBe(
      staticLearnerContentProvider
    );
  });
});
