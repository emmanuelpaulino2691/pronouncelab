import { courseRegistry } from "../data/courseRegistry";

export function getCourses() {
  return courseRegistry.courses;
}

export function getCourse(courseId: number) {
  return courseRegistry.courses.find(
    (course) => course.id === courseId
  );
}

export function getUnitsByCourse(courseId: number) {
  return courseRegistry.units.filter(
    (unit) => unit.courseId === courseId
  );
}

export function getUnit(unitId: number) {
  return courseRegistry.units.find(
    (unit) => unit.id === unitId
  );
}

export function getLessonsByUnit(unitId: number) {
  return courseRegistry.lessons.filter(
    (lesson) => lesson.unitId === unitId
  );
}

export function getLessonSummary(lessonId: number) {
  return courseRegistry.lessons.find(
    (lesson) => lesson.id === lessonId
  );
}

export function getLesson(lessonId: number) {
  return courseRegistry.lessonData[lessonId];
}

export function getUnitProgress(
  unitId: number,
  completedLessons: number[]
) {
  const lessons =
    getLessonsByUnit(unitId);

  if (lessons.length === 0) {
    return 0;
  }

  const completed =
    lessons.filter((lesson) =>
      completedLessons.includes(
        lesson.id
      )
    ).length;

  return Math.round(
    (completed / lessons.length) * 100
  );
}

export function getCourseProgress(
  courseId: number,
  completedLessons: number[]
) {
  const units =
    getUnitsByCourse(courseId);

  if (units.length === 0) {
    return 0;
  }

  const totalLessons =
    units.reduce(
      (total, unit) =>
        total +
        getLessonsByUnit(unit.id).length,
      0
    );

  if (totalLessons === 0) {
    return 0;
  }

  const completed =
    completedLessons.filter(
      (lessonId) =>
        courseRegistry.lessons.some(
          (lesson) =>
            lesson.id === lessonId &&
            lesson.unitId &&
            units.some(
              (unit) =>
                unit.id === lesson.unitId
            )
        )
    ).length;

  return Math.round(
    (completed / totalLessons) * 100
  );
}
