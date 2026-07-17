import { useState, useCallback } from "react";

import {
  loadUserProgress,
  saveUserProgress,
} from "../utils/progressStorage";

export function useUserProgress() {
  const [progress, setProgress] = useState(
    loadUserProgress()
  );

  const startLesson = useCallback(
    (lessonId: number) => {
      const latest = loadUserProgress();

      if (latest.lessonsStarted.includes(lessonId)) {
        saveUserProgress(latest);
        setProgress(latest);
        return false;
      }

      const updated = {
        ...latest,
        lessonsStarted: [
          ...latest.lessonsStarted,
          lessonId,
        ],
      };

      saveUserProgress(updated);
      setProgress(updated);

      return true;
    },
    []
  );

  const completeLesson = useCallback(
    (lessonId: number) => {
      const latest = loadUserProgress();

      if (latest.lessonsCompleted.includes(lessonId)) {
        saveUserProgress(latest);
        setProgress(latest);
        return false;
      }

      const updated = {
        ...latest,
        lessonsCompleted: [
          ...latest.lessonsCompleted,
          lessonId,
        ],
      };

      saveUserProgress(updated);
      setProgress(updated);

      return true;
    },
    []
  );

  const completeActivity = useCallback(
    (
      lessonId: number,
      activityIndex: number
    ) => {
      const latest = loadUserProgress();

      const existing =
        latest.activitiesCompleted.find(
          (item) =>
            item.lessonId === lessonId
        );

      if (
        existing?.activities.includes(
          activityIndex
        )
      ) {
        saveUserProgress(latest);
        setProgress(latest);
        return false;
      }

      const updatedActivities =
        existing
          ? latest.activitiesCompleted.map(
              (item) =>
                item.lessonId === lessonId
                  ? {
                      ...item,
                      activities: [
                        ...item.activities,
                        activityIndex,
                      ].sort((a, b) => a - b),
                    }
                  : item
            )
          : [
              ...latest.activitiesCompleted,
              {
                lessonId,
                activities: [
                  activityIndex,
                ],
              },
            ];

      const updated = {
        ...latest,
        activitiesCompleted:
          updatedActivities,
      };

      saveUserProgress(updated);
      setProgress(updated);

      return true;
    },
    []
  );

  return {
    progress,
    startLesson,
    completeLesson,
    completeActivity,
  };
}
