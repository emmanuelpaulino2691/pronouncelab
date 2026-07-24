import { describe, expect, it } from "vitest";

import { canOfferLessonPublication } from "./publicationState";

const draftContext = {
  canPublish: true,
  courseStatus: "draft" as const,
  unitStatus: "draft" as const,
  lessonStatus: "draft" as const,
  versionStatus: "draft" as const,
};

describe("Lesson Studio publication state", () => {
  it("offers publication to an authorized user with a draft hierarchy", () => {
    expect(canOfferLessonPublication(draftContext)).toBe(true);
  });

  it("does not offer publication without publication permission", () => {
    expect(
      canOfferLessonPublication({
        ...draftContext,
        canPublish: false,
      })
    ).toBe(false);
  });

  it.each([
    ["courseStatus", "archived"],
    ["unitStatus", "archived"],
    ["lessonStatus", "archived"],
    ["versionStatus", "published"],
  ] as const)(
    "does not offer publication when %s cannot accept a draft",
    (field, status) => {
      expect(
        canOfferLessonPublication({
          ...draftContext,
          [field]: status,
        })
      ).toBe(false);
    }
  );
});
