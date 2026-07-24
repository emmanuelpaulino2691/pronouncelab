export type PublicationValidation = { path: string[]; category: string; message: string; activityType?: string; };
export type PublicationResult = { ok: boolean; publishedAt?: string; validationErrors?: PublicationValidation[]; warnings?: string[]; };
export type PublishCourseInput = { courseId: number; expectedUpdatedAt?: string; };
export type PublishCourseResponse = PublicationResult & { courseId: number; publishedLessons?: number; unchangedLessons?: number; };
export type PublishLessonResponse = PublicationResult & { lessonVersionId: number; };
