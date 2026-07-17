import { contentProvider } from "../content/providers/localContentProvider";

export function getUnitsByCourse(courseId: number) {
  return contentProvider
    .getUnits()
    .filter((unit) => unit.courseId === courseId);
}

export function getUnit(unitId: number) {
  return contentProvider
    .getUnits()
    .find((unit) => unit.id === unitId);
}
