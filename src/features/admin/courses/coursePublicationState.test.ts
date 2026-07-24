import { describe, expect, it } from "vitest";
import { hasPublicationErrors, publicationErrorLabel } from "./coursePublicationState";

describe("course publication state", () => {
  it("keeps every validation error available for grouped display", () => {
    const errors = [
      { category: "activity", unitTitle: "Vowels", lessonTitle: "Short A", activityType: "listening", message: "Audio is missing." },
      { category: "activity", unitTitle: "Review", lessonTitle: "Final", activityType: "interactive_practice", message: "Incomplete." },
    ];
    expect(hasPublicationErrors(errors)).toBe(true);
    expect(publicationErrorLabel(errors[0])).toBe("Vowels — Short A — listening");
    expect(errors).toHaveLength(2);
  });

  it("recognizes an empty validation result", () => {
    expect(hasPublicationErrors([])).toBe(false);
  });
});
