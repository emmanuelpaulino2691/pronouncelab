import { describe, expect, it } from "vitest";
import { mergeLearnerProgress, parseServerLearnerProgress, pendingPublishedActivityIds } from "./learnerProgressSync";

describe("learner progress reconciliation", () => {
  it("merges local and server completion monotonically", () => {
    const merged = mergeLearnerProgress({ lessonsStarted: ["1"], lessonsCompleted: ["1"], activitiesCompleted: [{ lessonId: "1", activities: [0] }] }, { lessons: [{ lessonId: "2", completedAt: "2026-08-14", lastAccessedAt: "2026-08-14" }], activities: [{ lessonId: "2", activityId: "22", position: 1, completedAt: "2026-08-14" }] });
    expect(merged.lessonsCompleted).toEqual(["1", "2"]);
    expect(merged.activitiesCompleted).toEqual([{ lessonId: "1", activities: [0] }, { lessonId: "2", activities: [1] }]);
  });

  it("ignores malformed server rows and stale local indexes", () => {
    expect(parseServerLearnerProgress({ lessons: [{ lessonId: null }], activities: [{ lessonId: "1", activityId: "2", position: -1 }] })).toEqual({ lessons: [], activities: [] });
    expect(pendingPublishedActivityIds({ lessonsStarted: [], lessonsCompleted: [], activitiesCompleted: [{ lessonId: "1", activities: [0, 9] }] }, "1", [{ id: "10" }], { lessons: [], activities: [] })).toEqual(["10"]);
  });

  it("does not retry activity IDs already synchronized by another device", () => {
    expect(pendingPublishedActivityIds({ lessonsStarted: [], lessonsCompleted: [], activitiesCompleted: [{ lessonId: "1", activities: [0] }] }, "1", [{ id: "10" }], { lessons: [], activities: [{ lessonId: "1", activityId: "10", position: 0, completedAt: "now" }] })).toEqual([]);
  });
});
