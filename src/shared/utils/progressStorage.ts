import type { UserProgress } from "../types/UserProgress";

const KEY = "pronouncelab:user-progress";

const defaultProgress: UserProgress = {
  lessonsStarted: [],
  lessonsCompleted: [],
  activitiesCompleted: [],
};

export function loadUserProgress(): UserProgress {
  const value = localStorage.getItem(KEY);

  if (!value) {
    return defaultProgress;
  }

  try {
    const parsed = JSON.parse(value);

    return {
      ...defaultProgress,
      ...parsed,
    };
  } catch {
    return defaultProgress;
  }
}

export function saveUserProgress(
  progress: UserProgress
) {
  localStorage.setItem(
    KEY,
    JSON.stringify(progress)
  );
}
