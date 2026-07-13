import { units } from "../data/units";

export function getUnitsByCourse(courseId: number) {
  return units.filter((unit) => unit.courseId === courseId);
}
export function getUnitById(id: number) {
  return units.find((unit) => unit.id === id);
}