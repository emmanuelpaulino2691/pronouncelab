import { describe, expect, it } from "vitest";
import { nextDuplicateTitle } from "./duplicateNaming";

describe("duplicate naming", () => {
  it("uses Copy for the first duplicate", () => {
    expect(nextDuplicateTitle("Lesson 3", ["Lesson 3"])).toBe("Lesson 3 (Copy)");
  });

  it("increments repeat copies without replacing the source title", () => {
    expect(nextDuplicateTitle("Course", ["Course", "Course (Copy)", "Course (Copy 2)"])).toBe("Course (Copy 3)");
  });

  it("continues the sequence when a copy is duplicated", () => {
    expect(nextDuplicateTitle("Lesson (Copy)", ["Lesson", "Lesson (Copy)"])).toBe("Lesson (Copy 2)");
  });
});
