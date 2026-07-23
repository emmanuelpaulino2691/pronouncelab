import { describe, expect, it } from "vitest";

import type { LessonActivity } from "./types";
import { removeActivityAndSelectNearest } from "./activityDeletionState";

const activities = [1, 2, 3].map(
  (id, position): LessonActivity => ({
    id,
    lessonVersionId: 10,
    type: "theory",
    title: `Activity ${id}`,
    position,
    required: true,
    updatedAt: "2026-07-22T00:00:00.000Z",
  })
);

describe("removeActivityAndSelectNearest", () => {
  it("selects the following activity after deleting the selected activity", () => {
    const result = removeActivityAndSelectNearest(activities, 2, 2);

    expect(result.activities.map((activity) => activity.id)).toEqual([1, 3]);
    expect(result.selectedActivityId).toBe(3);
  });

  it("selects the preceding activity after deleting the final selected activity", () => {
    expect(
      removeActivityAndSelectNearest(activities, 3, 3).selectedActivityId
    ).toBe(2);
  });

  it("keeps the current selection when deleting another activity", () => {
    expect(
      removeActivityAndSelectNearest(activities, 1, 3).selectedActivityId
    ).toBe(3);
  });

  it("returns an empty state after deleting the last activity", () => {
    const result = removeActivityAndSelectNearest([activities[0]], 1, 1);

    expect(result.activities).toEqual([]);
    expect(result.selectedActivityId).toBeNull();
  });
});
