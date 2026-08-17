import { describe, expect, it } from "vitest";
import { hasSiblingTitle, hierarchyTitleSaveError, normalizeHierarchyTitle } from "./hierarchyTitleIntegrity";

describe("hierarchy sibling title integrity", () => {
  it("trims, folds case, and collapses internal whitespace", () => {
    expect(normalizeHierarchyTitle("  Lesson   1  ")).toBe("lesson 1");
  });

  it("detects only siblings and excludes the edited row", () => {
    const siblings = [{ id: 1, title: "Lesson 1" }, { id: 2, title: "Lesson 2" }];
    expect(hasSiblingTitle(siblings, " LESSON   1 ")).toBe(true);
    expect(hasSiblingTitle(siblings, "lesson 1", 1)).toBe(false);
  });

  it("maps authoritative Lesson constraint errors to the Unit-scoped message", () => {
    expect(hierarchyTitleSaveError({ code: "23505", message: 'duplicate key violates "lessons_unit_normalized_title_unique"' }, "Lesson", " Lesson 1 "))
      .toBe("A Lesson named 'Lesson 1' already exists in this Unit.");
  });

  it("maps authoritative Unit constraint errors to the Course-scoped message", () => {
    expect(hierarchyTitleSaveError({ code: "23505", message: 'duplicate key violates "units_course_normalized_title_unique"' }, "Unit", " Unit 1 "))
      .toBe("A Unit named 'Unit 1' already exists in this Course.");
  });
});
