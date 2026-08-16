import { describe, expect, it } from "vitest";
import { studentPreviewShellContract } from "./previewShellContract";

describe("authoring Student Preview shell", () => {
  it("has neither learner navigation nor authentication mutation", () => {
    expect(studentPreviewShellContract).toEqual({ usesLearnerNavigation: false, mutatesAuthentication: false });
  });
});
