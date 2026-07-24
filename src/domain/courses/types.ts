import type { CourseStatus, PublicationStatus } from "../shared/constants";

export type CourseSummary = { id: number; title: string; slug: string; status: CourseStatus; ownerId?: string; updatedAt?: string; unitCount?: number; };
export type CourseWorkspace = CourseSummary & { description: string; level: string; emoji: string; lessonCount?: number; activityCount?: number; };
export type CourseRelease = { id: number; courseId: number; releaseNumber: number; publishedAt: string; publishedBy?: string; };
export type CourseReleaseSummary = Pick<CourseRelease, "id" | "courseId" | "releaseNumber" | "publishedAt">;
export type CourseReleaseSelection = { courseId: number; releaseId: number; selectedAt?: string; };
export type AssignedCourseRelease = CourseReleaseSelection & { classId: number; status: PublicationStatus; };
