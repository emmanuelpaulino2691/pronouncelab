import { describe, expect, it } from "vitest";
import { previewLayoutContract, previewViewportStyle } from "./previewViewport";

describe("Student Preview viewport", () => {
  it("uses Desktop by default at the page state boundary", () => expect(previewViewportStyle("desktop")).toEqual({ width: "100%", maxWidth: "100%" }));
  it("uses an approximately 768px Tablet width", () => expect(previewViewportStyle("tablet").maxWidth).toBe("768px"));
  it("uses an approximately 390px Phone width", () => expect(previewViewportStyle("phone").maxWidth).toBe("390px"));
  it.each(["desktop", "tablet", "phone"] as const)("propagates %s to the shell and lesson", (mode) => {
    expect(previewLayoutContract(mode)).toEqual({ shellMode: mode, lessonMode: mode });
  });
});
