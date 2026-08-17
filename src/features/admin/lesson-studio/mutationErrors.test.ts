import { describe, expect, it } from "vitest";

import { lessonStudioMutationErrorMessage } from "./mutationErrors";

describe("Lesson Studio mutation errors", () => {
  it("keeps plain Supabase failures specific to the attempted operation", () => {
    const backendError = { code: "42501", message: "backend detail" };

    expect(lessonStudioMutationErrorMessage(backendError, "save block"))
      .toBe("Unable to save block. Your content is unchanged. Try again.");
    expect(lessonStudioMutationErrorMessage(backendError, "delete block"))
      .toBe("Unable to delete block. Your content is unchanged. Try again.");
    expect(lessonStudioMutationErrorMessage(backendError, "save question"))
      .toBe("Unable to save question. Your content is unchanged. Try again.");
    expect(lessonStudioMutationErrorMessage(backendError, "upload media"))
      .toBe("Unable to upload media. Your content is unchanged. Try again.");
  });

  it("sanitizes authorization failures while retaining the operation", () => {
    expect(lessonStudioMutationErrorMessage(
      { code: "42501", message: "permission denied for function internal_helper" },
      "save activity"
    )).toBe("You no longer have permission to save activity. Refresh the Studio or contact an administrator.");
  });

  it("preserves local validation errors", () => {
    expect(lessonStudioMutationErrorMessage(
      new Error("Question prompt is required."),
      "save question"
    )).toBe("Question prompt is required.");
  });
});
