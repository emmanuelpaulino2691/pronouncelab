import { useMemo } from "react";

import {
  getLesson,
  getLessonSummary,
  getUnit,
} from "../services/courseEngineService";
import { loadUserProgress } from "../utils/progressStorage";

export function useGlobalProgress() {
  const progress = loadUserProgress();

  const lessonProgress = useMemo(() => {
    return progress.lessonsStarted.flatMap(
      (lessonId) => {
        const lesson = getLesson(lessonId);
        const lessonSummary =
          getLessonSummary(lessonId);
        const unit =
          lessonSummary
            ? getUnit(lessonSummary.unitId)
            : undefined;

        if (!lesson || !lessonSummary || !unit) {
          return [];
        }

        const completedActivities =
          progress.activitiesCompleted.find(
            (item) =>
              item.lessonId === lessonId
          )?.activities.filter(
            (activityIndex) =>
              activityIndex >= 0 &&
              activityIndex <
                lesson.activities.length
          ).length ?? 0;

        const totalActivities =
          lesson.activities.length;

        const percent =
          totalActivities === 0
            ? 0
            : Math.round(
                (completedActivities /
                  totalActivities) *
                  100
              );

        return [{
          lessonId,
          totalActivities,
          completedActivities,
          percent,
        }];
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

  const continueLessonProgress =
    [...lessonProgress].reverse().find(
      (lesson) =>
        !progress.lessonsCompleted.includes(
          lesson.lessonId
        )
    ) ??
    lessonProgress.at(-1);

  return {
    lessonsStarted:
      progress.lessonsStarted.length,

    lessonsCompleted:
      progress.lessonsCompleted.length,

    completedActivities,

    completionRate,

    lessonProgress,

    continueLessonId:
      continueLessonProgress?.lessonId,

    continueLessonProgress,
  };
}
