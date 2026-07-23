import { describe, expect, it } from "vitest";

import {
  composeLearnerContentProvider,
  learnerContentProvider,
  learnerContentSource,
} from "./learnerContentComposition";
import { staticLearnerContentProvider } from "./providers/staticLearnerContentProvider";
import type { LearnerApiService } from "./api/LearnerApiService";

describe("learner content composition", () => {
  it("keeps the published Supabase provider active", () => {
    expect(learnerContentSource).toBe("supabase");
    expect(learnerContentProvider).not.toBe(staticLearnerContentProvider);
  });

  it("retains the local provider only as an explicit compatibility source", () => {
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
    expect(learnerContentSource).toBe("supabase");
    expect(learnerContentProvider).not.toBe(staticLearnerContentProvider);
  });
});
