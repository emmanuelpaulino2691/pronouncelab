import { describe, expect, it } from "vitest";
import type { LearnerCourse } from "../../shared/content/contracts/learnerContent";
import { courseDetailHierarchy, coursePageHierarchy, isLearnerLessonUnlocked, isLearnerUnitUnlocked, isUsableLearnerLesson, learnerJourneyActionLabel, resolveLearnerCourseState, resolveLearnerLessonState, resolveLearnerUnitState, resolveRecommendedLearnerStep, resolveSequentialLessonJourneys, resolveSequentialUnitJourneys, unitDetailHierarchy } from "./learnerJourney";

const makeCourse = (id: string, units: Array<{ id: string; lessons: Array<{ id: string; available?: boolean; activityCount?: number }> }>): LearnerCourse => ({
  id, slug: id, title: `Course ${id}`, description: "", level: "", emoji: "", position: 0, unitCount: units.length,
  units: units.map((unit, unitPosition) => ({ id: unit.id, courseId: id, title: `Unit ${unit.id}`, description: "", position: unitPosition, lessonCount: unit.lessons.length, lessons: unit.lessons.map((lesson, lessonPosition) => ({ id: lesson.id, unitId: unit.id, title: `Lesson ${lesson.id}`, description: "", position: lessonPosition, currentVersionId: lesson.id, activityCount: lesson.activityCount ?? 4, available: lesson.available ?? true })) })),
} as unknown as LearnerCourse);
const progress = (started: string[] = [], completed: string[] = [], activitiesCompleted: Array<{ lessonId: string; activities: number[] }> = []) => ({ lessonsStarted: started, lessonsCompleted: completed, activitiesCompleted });

describe("shared learner journey", () => {
  const course = makeCourse("course-a", [{ id: "unit-a", lessons: [{ id: "lesson-1" }, { id: "lesson-2" }] }]);

  it("resolves not-started, in-progress, and completed courses", () => {
    expect(resolveLearnerCourseState(course, progress()).state).toBe("not_started");
    expect(resolveLearnerCourseState(course, progress(["lesson-1"])).state).toBe("in_progress");
    expect(resolveLearnerCourseState(course, progress([], ["lesson-1", "lesson-2"])).state).toBe("completed");
  });

  it("calculates course progress from usable published lessons only", () => {
    const mixed = makeCourse("mixed", [{ id: "u", lessons: [{ id: "one" }, { id: "empty", activityCount: 0 }, { id: "unavailable", available: false }] }]);
    expect(resolveLearnerCourseState(mixed, progress([], ["one"]))).toMatchObject({ state: "completed", completedLessons: 1, totalLessons: 1, percent: 100 });
  });

  it("returns an empty course without an action", () => {
    const empty = makeCourse("empty", [{ id: "u", lessons: [] }]);
    expect(resolveLearnerCourseState(empty, progress())).toMatchObject({ state: "empty", action: null, totalLessons: 0 });
  });

  it("uses Start, Continue, and Review course wording", () => {
    expect(learnerJourneyActionLabel("start", "course")).toBe("Start course");
    expect(learnerJourneyActionLabel("continue", "course")).toBe("Continue course");
    expect(learnerJourneyActionLabel("review", "course")).toBe("Review course");
  });

  it("prioritizes a resumed course before the first published course", () => {
    const first = makeCourse("first", [{ id: "u1", lessons: [{ id: "first-lesson" }] }]);
    const current = makeCourse("current", [{ id: "u2", lessons: [{ id: "current-lesson" }] }]);
    expect(resolveRecommendedLearnerStep([first, current], progress(["current-lesson"]))?.course.id).toBe("current");
  });

  it("resolves not-started, in-progress, completed, and empty units", () => {
    const unit = course.units[0];
    expect(resolveLearnerUnitState(unit, progress()).state).toBe("not_started");
    expect(resolveLearnerUnitState(unit, progress([], ["lesson-1"]))).toMatchObject({ state: "in_progress", percent: 50 });
    expect(resolveLearnerUnitState(unit, progress([], ["lesson-1", "lesson-2"]))).toMatchObject({ state: "completed", percent: 100 });
    expect(resolveLearnerUnitState(makeCourse("x", [{ id: "empty", lessons: [] }]).units[0], progress()).state).toBe("empty");
  });

  it("skips empty units when recommending the next unit", () => {
    const withEmpty = makeCourse("a", [{ id: "empty", lessons: [] }, { id: "ready", lessons: [{ id: "lesson" }] }]);
    expect(resolveRecommendedLearnerStep([withEmpty], progress(), {}, { courseId: "a" })?.unit.id).toBe("ready");
  });

  it("selects the first incomplete unit after a completed unit", () => {
    const twoUnits = makeCourse("a", [{ id: "done", lessons: [{ id: "done-lesson" }] }, { id: "next", lessons: [{ id: "next-lesson" }] }]);
    expect(resolveRecommendedLearnerStep([twoUnits], progress([], ["done-lesson"]), {}, { courseId: "a" })?.unit.id).toBe("next");
  });

  it("resolves Start, Continue, and Review lesson states", () => {
    const lesson = course.units[0].lessons[0];
    expect(resolveLearnerLessonState(lesson, progress()).action).toBe("start");
    expect(resolveLearnerLessonState(lesson, progress(["lesson-1"])).action).toBe("continue");
    expect(resolveLearnerLessonState(lesson, progress([], ["lesson-1"])).action).toBe("review");
  });

  it("preserves the exact validated resumed activity", () => {
    const step = resolveRecommendedLearnerStep([course], progress(["lesson-1"], [], [{ lessonId: "lesson-1", activities: [0, 1] }]), { "lesson-1": 2 });
    expect(step).toMatchObject({ kind: "continue", activityIndex: 2, completedActivities: 2, href: "/lessons/lesson-1" });
  });

  it("does not recommend a lesson without usable activities", () => {
    const emptyLesson = makeCourse("a", [{ id: "u", lessons: [{ id: "empty", activityCount: 0 }, { id: "ready" }] }]);
    expect(isUsableLearnerLesson(emptyLesson.units[0].lessons[0])).toBe(false);
    expect(resolveRecommendedLearnerStep([emptyLesson], progress())?.lesson.id).toBe("ready");
  });

  it("offers review instead of inventing a next lesson when everything is complete", () => {
    const step = resolveRecommendedLearnerStep([course], progress([], ["lesson-1", "lesson-2"]));
    expect(step).toMatchObject({ kind: "review", lesson: { id: "lesson-1" } });
  });

  it("uses the same resolver for Home, Course, and Unit scopes", () => {
    const stored = progress(["lesson-2"], ["lesson-1"]);
    expect(resolveRecommendedLearnerStep([course], stored)?.lesson.id).toBe("lesson-2");
    expect(resolveRecommendedLearnerStep([course], stored, {}, { courseId: "course-a" })?.lesson.id).toBe("lesson-2");
    expect(resolveRecommendedLearnerStep([course], stored, {}, { unitId: "unit-a" })?.lesson.id).toBe("lesson-2");
  });

  it("ignores stale progress safely", () => {
    expect(resolveRecommendedLearnerStep([course], progress(["missing"], ["gone"]))?.lesson.id).toBe("lesson-1");
  });

  it("does not invent duration or lesson purpose", () => {
    const summary = resolveLearnerLessonState(course.units[0].lessons[0], progress());
    expect(summary).not.toHaveProperty("duration");
    expect(summary).not.toHaveProperty("lessonPurpose");
  });

  it("unlocks lessons sequentially and preserves completed review access", () => {
    const initial = resolveSequentialLessonJourneys(course.units[0], progress());
    expect(initial.map(({ locked, current }) => ({ locked, current }))).toEqual([
      { locked: false, current: true },
      { locked: true, current: false },
    ]);
    const advanced = resolveSequentialLessonJourneys(course.units[0], progress([], ["lesson-1"]));
    expect(advanced.map(({ locked, current }) => ({ locked, current }))).toEqual([
      { locked: false, current: false },
      { locked: false, current: true },
    ]);
    expect(isLearnerLessonUnlocked(course.units[0], "lesson-2", progress())).toBe(false);
  });

  it("unlocks units only after all usable lessons in the prior unit are complete", () => {
    const sequenced = makeCourse("sequence", [
      { id: "unit-1", lessons: [{ id: "lesson-1" }] },
      { id: "unit-2", lessons: [{ id: "lesson-2" }] },
    ]);
    expect(resolveSequentialUnitJourneys(sequenced, progress()).map(({ locked }) => locked)).toEqual([false, true]);
    expect(isLearnerUnitUnlocked(sequenced, "unit-2", progress([], ["lesson-1"]))).toBe(true);
    expect(resolveRecommendedLearnerStep([sequenced], progress())?.lesson.id).toBe("lesson-1");
  });

  it("keeps recommendation first in each responsive page hierarchy", () => {
    expect(coursePageHierarchy[0]).toBe("recommended-course");
    expect(courseDetailHierarchy[1]).toBe("recommended-unit");
    expect(unitDetailHierarchy[1]).toBe("recommended-lesson");
  });
});
