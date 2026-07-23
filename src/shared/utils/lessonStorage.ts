const PREFIX = "pronouncelab:lesson:";

import type { LessonState } from "../types/LessonState";

export function loadLessonState(
  lessonId: string
): LessonState | null {
  const value = localStorage.getItem(
    `${PREFIX}${lessonId}`
  );

  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value);

    return {
      currentActivity: parsed.currentActivity ?? 0,
      completedActivities:
        parsed.completedActivities ?? [],
    };
  } catch {
    return null;
  }
}

export function saveLessonState(
  lessonId: string,
  state: LessonState
) {
  localStorage.setItem(
    `${PREFIX}${lessonId}`,
    JSON.stringify(state)
  );
}

export function clearLessonState(lessonId: string) {
  localStorage.removeItem(`${PREFIX}${lessonId}`);
}
