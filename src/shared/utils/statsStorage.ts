import type { UserStats } from "../types/UserStats";

const KEY = "pronouncelab:user-stats";

const defaults: UserStats = {
  xp: 0,
  level: 1,
  streak: 0,
};

export function loadUserStats(): UserStats {

  const value =
    localStorage.getItem(KEY);

  if (!value) {
    return defaults;
  }

  try {
    return {
      ...defaults,
      ...JSON.parse(value),
    };
  } catch {
    return defaults;
  }
}

export function saveUserStats(
  stats: UserStats
) {
  localStorage.setItem(
    KEY,
    JSON.stringify(stats)
  );
}
