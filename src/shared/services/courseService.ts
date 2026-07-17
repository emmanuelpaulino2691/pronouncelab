import { contentProvider } from "../content/providers/localContentProvider";

export function getCourses() {
  return contentProvider.getCourses();
}

export function getCourse(courseId: number) {
  return contentProvider
    .getCourses()
    .find((course) => course.id === courseId);
}
