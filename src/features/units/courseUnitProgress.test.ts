import { describe, expect, it } from "vitest";
import { getCourseUnitProgress, recommendedUnitIndex, unitActionLabel } from "./courseUnitProgress";

describe("course unit progress presentation", () => {
  it("derives truthful progress from completed lesson IDs", () => expect(getCourseUnitProgress(["1", "2"], ["1"])).toEqual({ completedLessons: 1, totalLessons: 2, percent: 50, state: "in_progress" }));
  it("distinguishes empty and completed units", () => { expect(getCourseUnitProgress([], []).state).toBe("empty"); const complete = getCourseUnitProgress(["1"], ["1"]); expect(complete.state).toBe("completed"); expect(unitActionLabel(complete)).toBe("Review unit"); });
  it("recommends the first incomplete non-empty unit", () => { const progress = [getCourseUnitProgress(["1"], ["1"]), getCourseUnitProgress(["2"], [])]; expect(recommendedUnitIndex(progress)).toBe(1); expect(unitActionLabel(progress[1])).toBe("Start unit"); });
});
