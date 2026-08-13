import { useState, useCallback, useEffect } from "react";

import {
  loadUserProgress,
  saveUserProgress,
} from "../utils/progressStorage";
import { loadServerLearnerProgress, recordServerActivityCompletion, recordServerLessonVisit } from "../progress/learnerProgressService";
import { mergeLearnerProgress, pendingPublishedActivityIds } from "../progress/learnerProgressSync";

export function useUserProgress() {
  const [progress, setProgress] = useState(
    loadUserProgress()
  );

  useEffect(() => {
    let active = true;
    void loadServerLearnerProgress().then((server) => {
      if (!active || !server) return;
      const merged = mergeLearnerProgress(loadUserProgress(), server);
      saveUserProgress(merged);
      setProgress(merged);
    });
    return () => { active = false; };
  }, []);

  const startLesson = useCallback(
    (lessonId: string) => {
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
      void recordServerLessonVisit(lessonId);

      return true;
    },
    []
  );

  const completeLesson = useCallback(
    (lessonId: string) => {
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
      lessonId: string,
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

  const syncLesson = useCallback(async (lessonId: string, activities: readonly { id: string }[]) => {
    const local = loadUserProgress();
    const server = await loadServerLearnerProgress();
    if (!server) return false;
    await recordServerLessonVisit(lessonId, activities[0]?.id);
    const pending = pendingPublishedActivityIds(local, lessonId, activities, server);
    const results = await Promise.all(pending.map(recordServerActivityCompletion));
    const refreshed = await loadServerLearnerProgress();
    if (refreshed) {
      const merged = mergeLearnerProgress(loadUserProgress(), refreshed);
      saveUserProgress(merged);
      setProgress(merged);
    }
    return results.every(Boolean);
  }, []);

  const syncActivity = useCallback((activityId: string) => {
    void recordServerActivityCompletion(activityId).then(async (saved) => {
      if (!saved) return;
      const server = await loadServerLearnerProgress();
      if (!server) return;
      const merged = mergeLearnerProgress(loadUserProgress(), server);
      saveUserProgress(merged);
      setProgress(merged);
    });
  }, []);

  const resetLessonProgress = useCallback((lessonId: string) => {
    const latest = loadUserProgress();
    const updated = {
      lessonsStarted: latest.lessonsStarted.filter((id) => id !== lessonId),
      lessonsCompleted: latest.lessonsCompleted.filter((id) => id !== lessonId),
      activitiesCompleted: latest.activitiesCompleted.filter((item) => item.lessonId !== lessonId),
    };
    saveUserProgress(updated);
    setProgress(updated);
  }, []);

  return {
    progress,
    startLesson,
    completeLesson,
    completeActivity,
    syncActivity,
    syncLesson,
    resetLessonProgress,
  };
}
