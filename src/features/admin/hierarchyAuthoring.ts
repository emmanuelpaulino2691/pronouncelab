import type { CourseStatus } from "./courses/adminCourseService";

const acceptsDraftDescendants = (status: CourseStatus | null) =>
  status === "draft" || status === "published";

export function canCreateDraftUnit(
  canEditDrafts: boolean,
  courseStatus: CourseStatus | null
) {
  return canEditDrafts && acceptsDraftDescendants(courseStatus);
}

export function canCreateDraftLesson(
  canEditDrafts: boolean,
  courseStatus: CourseStatus | null,
  unitStatus: CourseStatus | null
) {
  return canEditDrafts &&
    acceptsDraftDescendants(courseStatus) &&
    acceptsDraftDescendants(unitStatus);
}

export function canEditDraftUnit(
  canEditDrafts: boolean,
  unitStatus: CourseStatus
) {
  return canEditDrafts && unitStatus === "draft";
}

export function canEditDraftLesson(
  canEditDrafts: boolean,
  lessonStatus: CourseStatus,
  currentPublishedVersionId: number | null
) {
  return canEditDrafts && lessonStatus === "draft" &&
    currentPublishedVersionId === null;
}
