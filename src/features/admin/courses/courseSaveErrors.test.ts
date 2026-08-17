import { describe, expect, it } from "vitest";

import { getCourseSaveErrorMessage } from "./courseSaveErrors";

describe("course save errors", () => {
  it("maps a structured duplicate slug error", () => {
    expect(getCourseSaveErrorMessage({
      code: "23505",
      message: "duplicate key value violates unique constraint courses_slug_key",
    })).toBe("That course address is already in use. Choose a different address.");
  });

  it("maps the stale initial position collision", () => {
    expect(getCourseSaveErrorMessage({
      code: "23505",
      message: "duplicate key value violates unique constraint courses_position_unique",
    })).toContain("course order changed");
  });
});
