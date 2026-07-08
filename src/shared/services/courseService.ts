import { courses } from "../data/courses";

export function getCourses() {
  return courses;
}

export function getCourseById(id: number) {
  return courses.find((course) => course.id === id);
}