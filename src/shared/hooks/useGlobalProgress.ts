import { useMemo } from "react";

import { getLesson } from "../services/courseEngineService";
import { loadUserProgress } from "../utils/progressStorage";

export function useGlobalProgress() {
  const progress = loadUserProgress();

  const lessonProgress = useMemo(() => {
    return progress.lessonsStarted.map(
      (lessonId) => {
        const lesson = getLesson(lessonId);

        const completedActivities =
          progress.activitiesCompleted.find(
            (item) =>
              item.lessonId === lessonId
          )?.activities.length ?? 0;

        const totalActivities =
          lesson?.activities.length ?? 0;

        const percent =
          totalActivities === 0
            ? 0
            : Math.round(
                (completedActivities /
                  totalActivities) *
                  100
              );

        return {
          lessonId,
          totalActivities,
          completedActivities,
          percent,
        };
      }
    );
  }, [progress]);

  const totalActivities =
    lessonProgress.reduce(
      (total, lesson) =>
        total + lesson.totalActivities,
      0
    );

  const completedActivities =
    lessonProgress.reduce(
      (total, lesson) =>
        total + lesson.completedActivities,
      0
    );

  const completionRate =
    totalActivities === 0
      ? 0
      : Math.round(
          (completedActivities /
            totalActivities) *
            100
        );

  const continueLessonId =
    lessonProgress.find(
      (lesson) =>
        lesson.percent < 100
    )?.lessonId ??
    lessonProgress[0]?.lessonId;

  return {
    lessonsStarted:
      progress.lessonsStarted.length,

    lessonsCompleted:
      progress.lessonsCompleted.length,

    completedActivities,

    completionRate,

    lessonProgress,

    continueLessonId,
  };
}
