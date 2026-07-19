import { describe, expect, it } from "vitest";

import {
  learnerContentProvider,
  learnerContentSource,
} from "./learnerContentComposition";
import { staticLearnerContentProvider } from "./providers/staticLearnerContentProvider";

describe("learner content composition", () => {
  it("keeps the local static provider active", () => {
    expect(learnerContentSource).toBe("local");
    expect(learnerContentProvider).toBe(
      staticLearnerContentProvider
    );
  });
});
