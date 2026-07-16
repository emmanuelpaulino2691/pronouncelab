import { useState } from "react";

import {
  loadAchievements,
  saveAchievements,
} from "../utils/achievementStorage";

export function useAchievements() {

  const [achievements, setAchievements] =
    useState(loadAchievements());

  function unlock(id: string) {

    setAchievements(previous => {

      const updated = previous.map(item =>
        item.id === id
          ? { ...item, unlocked: true }
          : item
      );

      saveAchievements(updated);

      return updated;

    });

  }

  return {
    achievements,
    unlock,
  };
}
