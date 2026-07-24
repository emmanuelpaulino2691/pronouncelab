import type { CoursePublicationError } from "./adminCourseService";

export function publicationErrorLabel(error: CoursePublicationError): string {
  return [error.unitTitle, error.lessonTitle, error.activityType]
    .filter((value): value is string => Boolean(value))
    .join(" — ");
}

export function hasPublicationErrors(errors: readonly CoursePublicationError[]): boolean {
  return errors.length > 0;
}
