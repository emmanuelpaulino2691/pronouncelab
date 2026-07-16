import type { Achievement } from "../types/Achievement";

const KEY = "pronouncelab:achievements";

const defaults: Achievement[] = [
  {
    id: "first-lesson",
    title: "First Lesson",
    description: "Complete your first lesson.",
    unlocked: false,
  },
  {
    id: "100-xp",
    title: "100 XP",
    description: "Reach 100 XP.",
    unlocked: false,
  },
];

export function loadAchievements() {
  const value = localStorage.getItem(KEY);

  if (!value) return defaults;

  try {
    return JSON.parse(value) as Achievement[];
  } catch {
    return defaults;
  }
}

export function saveAchievements(
  achievements: Achievement[]
) {
  localStorage.setItem(
    KEY,
    JSON.stringify(achievements)
  );
}
