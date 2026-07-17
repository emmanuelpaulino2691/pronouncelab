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
    const previous =
      loadUserStats();

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
    setStats(updated);

    return updated;
  }

  return {
    stats,
    addXP,
  };

}
