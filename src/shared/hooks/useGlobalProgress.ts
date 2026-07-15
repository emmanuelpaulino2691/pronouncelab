import { useMemo } from "react";

import { getLesson } from "../services/courseEngineService";
import { loadLessonState } from "../utils/lessonStorage";
import { loadUserProgress } from "../utils/progressStorage";

export function useGlobalProgress() {
  const progress = loadUserProgress();

  const lessonProgress = useMemo(() => {
    return progress.lessonsStarted.map((lessonId) => {
      const lesson = getLesson(lessonId);
      const state = loadLessonState(lessonId);

      const totalActivities = lesson?.activities.length ?? 0;
      const completedActivities =
        state?.completedActivities.length ?? 0;

      const percent =
        totalActivities === 0
          ? 0
          : Math.round(
              (completedActivities / totalActivities) * 100
            );

      return {
        lessonId,
        totalActivities,
        completedActivities,
        percent,
      };
    });
  }, [progress]);

  const totalActivities = lessonProgress.reduce(
    (total, lesson) => total + lesson.totalActivities,
    0
  );

  const completedActivities = lessonProgress.reduce(
    (total, lesson) => total + lesson.completedActivities,
    0
  );

  const completionRate =
    totalActivities === 0
      ? 0
      : Math.round(
          (completedActivities / totalActivities) * 100
        );

  return {
    lessonsStarted: progress.lessonsStarted.length,
    lessonsCompleted: progress.lessonsCompleted.length,
    completedActivities,
    completionRate,
    lessonProgress,
  };
}
