import { describe, expect, it } from "vitest";

import { buildPublishedProgress, normalizeProgressLessonId, progressForPublishedLessons } from "./progressCompatibility";

describe("published progress compatibility", () => {
  it("preserves legacy numeric lesson IDs as canonical route strings", () => {
    expect(normalizeProgressLessonId(42)).toBe("42");
  });

  it("ignores progress for lessons that are no longer published", () => {
    expect(progressForPublishedLessons(["1", "2"], ["2", "3"])).toBe(50);
  });

  it("preserves continue learning for published string identifiers", () => {
    const result = buildPublishedProgress(
      [{ id: "20", activityCount: 3 }, { id: "21", activityCount: 2 }],
      {
        lessonsStarted: ["20", "999", "21"],
        lessonsCompleted: ["20", "999"],
        activitiesCompleted: [
          { lessonId: "20", activities: [0, 1, 2] },
          { lessonId: "21", activities: [0] },
        ],
      }
    );

    expect(result.lessonsStarted).toBe(2);
    expect(result.lessonsCompleted).toBe(1);
    expect(result.continueLessonProgress).toMatchObject({ lessonId: "21", percent: 50 });
  });
});
