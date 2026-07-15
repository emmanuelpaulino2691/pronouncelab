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
      setProgress((previous) => {
        if (
          previous.lessonsStarted.includes(lessonId)
        ) {
          return previous;
        }

        const updated = {
          ...previous,
          lessonsStarted: [
            ...previous.lessonsStarted,
            lessonId,
          ],
        };

        saveUserProgress(updated);

        return updated;
      });
    },
    []
  );

  const completeLesson = useCallback(
    (lessonId: number) => {
      setProgress((previous) => {
        if (
          previous.lessonsCompleted.includes(lessonId)
        ) {
          return previous;
        }

        const updated = {
          ...previous,
          lessonsCompleted: [
            ...previous.lessonsCompleted,
            lessonId,
          ],
        };

        saveUserProgress(updated);

        return updated;
      });
    },
    []
  );

  const completeActivity = useCallback(
    (
      lessonId: number,
      activityIndex: number
    ) => {
      setProgress((previous) => {
        const existing =
          previous.activitiesCompleted.find(
            (item) =>
              item.lessonId === lessonId
          );

        if (
          existing?.activities.includes(
            activityIndex
          )
        ) {
          return previous;
        }

        const updatedActivities =
          existing
            ? previous.activitiesCompleted.map(
                (item) =>
                  item.lessonId === lessonId
                    ? {
                        ...item,
                        activities: [
                          ...item.activities,
                          activityIndex,
                        ],
                      }
                    : item
              )
            : [
                ...previous.activitiesCompleted,
                {
                  lessonId,
                  activities: [
                    activityIndex,
                  ],
                },
              ];

        const updated = {
          ...previous,
          activitiesCompleted:
            updatedActivities,
        };

        saveUserProgress(updated);

        return updated;
      });
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
