import {
  getPlayableLessonsByCourse,
  getPlayableLessonsByUnit,
} from "./lessonService";

export function getUnitProgress(
  unitId: number,
  completedLessons: number[]
) {
  const lessons =
    getPlayableLessonsByUnit(unitId);

  if (lessons.length === 0) {
    return 0;
  }

  const completed = lessons.filter((lesson) =>
    completedLessons.includes(lesson.id)
  ).length;

  return Math.round(
    (completed / lessons.length) * 100
  );
}

export function getCourseProgress(
  courseId: number,
  completedLessons: number[]
) {
  const lessonIds =
    getPlayableLessonsByCourse(courseId)
      .map((lesson) => lesson.id);

  if (lessonIds.length === 0) {
    return 0;
  }

  const completed = lessonIds.filter((id) =>
    completedLessons.includes(id)
  ).length;

  return Math.round(
    (completed / lessonIds.length) * 100
  );
}
