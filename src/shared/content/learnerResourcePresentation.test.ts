import { describe, expect, it } from "vitest";

import { hasLearnerLoadFailure } from "./learnerResourcePresentation";

describe("learner resource presentation", () => {
  it("does not turn a successfully loaded learner route into an error", () => {
    expect(hasLearnerLoadFailure(false, null)).toBe(false);
  });

  it("keeps not-found separate from infrastructure failures", () => {
    const notFound = { code: "not_found" as const, message: "Not found", retryable: false };
    const unavailable = { code: "unavailable" as const, message: "Unavailable", retryable: true };
    expect(hasLearnerLoadFailure(false, notFound)).toBe(false);
    expect(hasLearnerLoadFailure(false, unavailable)).toBe(true);
  });

  it("does not replace the loading state with an error", () => {
    const unavailable = { code: "unavailable" as const, message: "Unavailable", retryable: true };
    expect(hasLearnerLoadFailure(true, unavailable)).toBe(false);
  });
});
