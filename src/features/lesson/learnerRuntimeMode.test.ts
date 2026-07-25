import { describe, expect, it } from "vitest";
import { isPreviewMode, shouldPersistLearnerMutation } from "./learnerRuntimeMode";

describe("learner runtime mode", () => {
  it("isolates preview mutations", () => {
    expect(isPreviewMode("teacher_preview")).toBe(true);
    expect(shouldPersistLearnerMutation("teacher_preview")).toBe(false);
    expect(shouldPersistLearnerMutation("learner")).toBe(true);
  });
});
