export type CourseUnitProgress = { completedLessons: number; totalLessons: number; percent: number; state: "not_started" | "in_progress" | "completed" | "empty" };

export function getCourseUnitProgress(lessonIds: readonly string[], completedLessonIds: readonly string[]): CourseUnitProgress {
  if (lessonIds.length === 0) return { completedLessons: 0, totalLessons: 0, percent: 0, state: "empty" };
  const completed = new Set(completedLessonIds);
  const completedLessons = lessonIds.filter((id) => completed.has(id)).length;
  return { completedLessons, totalLessons: lessonIds.length, percent: Math.round(completedLessons / lessonIds.length * 100), state: completedLessons === lessonIds.length ? "completed" : completedLessons > 0 ? "in_progress" : "not_started" };
}

export function recommendedUnitIndex(progress: readonly CourseUnitProgress[]) {
  const next = progress.findIndex((unit) => unit.state !== "completed" && unit.state !== "empty");
  return next >= 0 ? next : progress.findIndex((unit) => unit.state === "completed");
}

export function unitActionLabel(progress: CourseUnitProgress) {
  if (progress.state === "completed") return "Review unit";
  if (progress.state === "in_progress") return "Continue unit";
  return "Start unit";
}
