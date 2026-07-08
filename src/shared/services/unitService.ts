import { units } from "../data/units";

export function getUnitsByCourse(courseId: number) {
  return units.filter((unit) => unit.courseId === courseId);
}