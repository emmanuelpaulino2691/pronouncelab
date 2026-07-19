import type { LearnerActivity } from "./learnerActivities";

declare const contentIdBrand: unique symbol;

export type ContentId = string & {
  readonly [contentIdBrand]: "ContentId";
};

export type ContentSource = "local" | "supabase";

export type PublishedLessonMetadata = {
  source: "supabase";
  lessonId: ContentId;
  lessonVersionId: ContentId;
  versionNumber: number;
  publishedAt: string;
  schemaVersion: 1;
};

export type LocalLessonMetadata = {
  source: "local";
  lessonId: ContentId;
  fixtureRevision: "1";
};

export type LearnerLessonMetadata =
  | PublishedLessonMetadata
  | LocalLessonMetadata;

export type LearnerCourseSummary = {
  id: ContentId;
  slug: string;
  title: string;
  description: string;
  level: string;
  emoji: string;
  position: number;
  unitCount: number;
};

export type LearnerCourse = LearnerCourseSummary & {
  readonly units: readonly LearnerUnitSummary[];
};

export type LearnerUnitSummary = {
  id: ContentId;
  courseId: ContentId;
  title: string;
  description: string;
  position: number;
  lessonCount: number;
};

export type LearnerUnit = LearnerUnitSummary & {
  readonly lessons: readonly LearnerLessonSummary[];
};

export type LearnerLessonSummary = {
  id: ContentId;
  unitId: ContentId;
  title: string;
  description: string;
  position: number;
  currentVersionId: ContentId | null;
  activityCount: number;
  available: boolean;
};

export type LearnerLesson = {
  id: ContentId;
  unitId: ContentId;
  courseId: ContentId;
  title: string;
  description: string;
  readonly metadata: LearnerLessonMetadata;
  readonly activities: readonly LearnerActivity[];
};

export function contentIdFromStaticNumber(
  value: number
): ContentId | null {
  if (
    !Number.isSafeInteger(value) ||
    value < 0
  ) {
    return null;
  }

  return String(value) as ContentId;
}
