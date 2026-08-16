import { describe, expect, it } from "vitest";
import { courseRemovalDescription, isActiveAuthoringCourse, lessonRemovalDescription, unitRemovalDescription } from "./removalPresentation";

describe("published source removal presentation", () => {
  it("explains that published Lesson history is preserved", () => {
    expect(lessonRemovalDescription({ title: "Lesson B", status: "published" }))
      .toContain("Existing published content and learner history will not be changed");
  });

  it("explains cascading Unit removal without claiming history is deleted", () => {
    const copy = unitRemovalDescription({ title: "Unit 2", status: "published" });
    expect(copy).toContain("Its Lessons will be removed from the next Course update");
    expect(copy).toContain("learner history remain unchanged");
  });

  it("explains the selected active-Assignment retirement contract", () => {
    const copy = courseRemovalDescription({ title: "The Vowels", status: "published" });
    expect(copy).toContain("Existing Class Assignments");
    expect(copy).toContain("learner history remain available");
  });

  it("keeps concise destructive copy for draft-only content", () => {
    expect(lessonRemovalDescription({ title: "Draft Lesson", status: "draft" }))
      .toBe("Delete “Draft Lesson” and its draft content?");
  });

  it("hides retired Courses from the default active authoring collection", () => {
    expect(isActiveAuthoringCourse("published")).toBe(true);
    expect(isActiveAuthoringCourse("archived")).toBe(false);
  });
});
