import { getLessonsByUnit } from "./lessonService";
import { getUnitsByCourse } from "./unitService";

export function getUnitProgress(
  unitId: number,
  completedLessons: number[]
) {
  const lessons = getLessonsByUnit(unitId);

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
  const units = getUnitsByCourse(courseId);

  const lessonIds = units.flatMap((unit) =>
    getLessonsByUnit(unit.id).map((lesson) => lesson.id)
  );

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
