import type { CoursePublicationError } from "./adminCourseService";

export function publicationErrorLabel(error: CoursePublicationError): string {
  const activity = error.activityTitle
    ? `${error.activityTitle}${error.activityType ? ` (${error.activityType.replaceAll("_", " ")})` : ""}`
    : error.activityType?.replaceAll("_", " ");
  return [error.unitTitle, error.lessonTitle, activity]
    .filter((value): value is string => Boolean(value))
    .join(" — ") + ":";
}

export function hasPublicationErrors(errors: readonly CoursePublicationError[]): boolean {
  return errors.length > 0;
}
