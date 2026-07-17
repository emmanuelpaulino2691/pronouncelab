import { contentProvider } from "../content/providers/localContentProvider";

export function getLessonsByUnit(unitId: number) {
  return contentProvider
    .getLessons()
    .filter((lesson) => lesson.unitId === unitId);
}

export function getLessonSummary(lessonId: number) {
  return contentProvider
    .getLessons()
    .find((lesson) => lesson.id === lessonId);
}

export function getLesson(lessonId: number) {
  return contentProvider
    .getLessonData()[lessonId];
}
