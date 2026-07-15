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