import { useState } from "react";

import {
  loadUserStats,
  saveUserStats,
} from "../utils/statsStorage";

export function useUserStats() {

  const [stats, setStats] =
    useState(loadUserStats());

  function addXP(
    amount: number
  ) {

    setStats(previous => {

      const xp =
        previous.xp + amount;

      const level =
        Math.floor(xp / 100) + 1;

      const updated = {
        ...previous,
        xp,
        level,
      };

      saveUserStats(updated);

      return updated;

    });

  }

  return {
    stats,
    addXP,
  };

}
