export function normalizeProgressLessonId(value: string | number): string {
  return String(value);
}

export function progressForPublishedLessons(
  completedLessonIds: readonly string[],
  publishedLessonIds: readonly string[]
): number {
  if (publishedLessonIds.length === 0) return 0;
  const completed = new Set(completedLessonIds);
  return Math.round(publishedLessonIds.filter((id) => completed.has(id)).length / publishedLessonIds.length * 100);
}

export type PublishedLessonProgress = {
  lessonId: string;
  totalActivities: number;
  completedActivities: number;
  percent: number;
};

export function buildPublishedProgress(
  lessons: readonly { id: string; activityCount: number }[],
  progress: {
    lessonsStarted: readonly string[];
    lessonsCompleted: readonly string[];
    activitiesCompleted: readonly { lessonId: string; activities: readonly number[] }[];
  }
) {
  const available = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  const lessonProgress = progress.lessonsStarted.flatMap((lessonId): PublishedLessonProgress[] => {
    const lesson = available.get(lessonId);
    if (!lesson) return [];
    const validActivities = new Set(
      progress.activitiesCompleted.find((item) => item.lessonId === lessonId)?.activities
        .filter((index) => index >= 0 && index < lesson.activityCount) ?? []
    );
    return [{
      lessonId,
      totalActivities: lesson.activityCount,
      completedActivities: validActivities.size,
      percent: lesson.activityCount === 0 ? 0 : Math.round(validActivities.size / lesson.activityCount * 100),
    }];
  });
  const totalActivities = lessonProgress.reduce((total, lesson) => total + lesson.totalActivities, 0);
  const completedActivities = lessonProgress.reduce((total, lesson) => total + lesson.completedActivities, 0);
  const completed = new Set(progress.lessonsCompleted);
  return {
    lessonsStarted: lessonProgress.length,
    lessonsCompleted: lessons.filter((lesson) => completed.has(lesson.id)).length,
    completedActivities,
    completionRate: totalActivities === 0 ? 0 : Math.round(completedActivities / totalActivities * 100),
    lessonProgress,
    continueLessonProgress: [...lessonProgress].reverse().find((lesson) => !completed.has(lesson.lessonId)) ?? lessonProgress.at(-1),
  };
}
