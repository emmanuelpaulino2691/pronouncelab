import type { UserProgress } from "../types/UserProgress";

const KEY = "pronouncelab:user-progress";

export function loadUserProgress(): UserProgress {
  const value = localStorage.getItem(KEY);

  if (!value) {
    return {
      lessonsStarted: [],
      lessonsCompleted: [],
    };
  }

  try {
    return JSON.parse(value);
  } catch {
    return {
      lessonsStarted: [],
      lessonsCompleted: [],
    };
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