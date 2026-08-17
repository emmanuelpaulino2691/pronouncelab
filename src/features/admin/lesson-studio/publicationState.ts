import type { CourseStatus } from "../courses/adminCourseService";
import type { LessonVersion } from "./types";

type PublicationContext = {
  canPublish: boolean;
  courseStatus: CourseStatus | null;
  unitStatus: CourseStatus | null;
  lessonStatus: CourseStatus | null;
  versionStatus: LessonVersion["status"] | null;
};

export function canOfferLessonPublication({
  canPublish,
  courseStatus,
  unitStatus,
  lessonStatus,
  versionStatus,
}: PublicationContext) {
  return (
    canPublish &&
    (courseStatus === "draft" || courseStatus === "published") &&
    (unitStatus === "draft" || unitStatus === "published") &&
    (lessonStatus === "draft" || lessonStatus === "published") &&
    versionStatus === "draft"
  );
}
