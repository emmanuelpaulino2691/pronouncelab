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
        if (previous.lessonsStarted.includes(lessonId)) {
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

  return {
    progress,
    startLesson,
    completeLesson,
  };
}