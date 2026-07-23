import type { UserProgress } from "../types/UserProgress";

const KEY = "pronouncelab:user-progress";

const defaultProgress: UserProgress = {
  lessonsStarted: [],
  lessonsCompleted: [],
  activitiesCompleted: [],
};

function uniqueIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value.filter(
        (item): item is string | number =>
          (typeof item === "string" && item.trim().length > 0) ||
          (typeof item === "number" && Number.isSafeInteger(item) && item >= 0)
      )
      .map(String)
    ),
  ];
}

function normalizeProgress(
  value: unknown
): UserProgress {
  const stored =
    typeof value === "object" &&
    value !== null
      ? value as Record<string, unknown>
      : {};

  const activitiesByLesson =
    new Map<string, Set<number>>();

  if (Array.isArray(stored.activitiesCompleted)) {
    stored.activitiesCompleted.forEach((item) => {
      if (
        typeof item !== "object" ||
        item === null
      ) {
        return;
      }

      const activityProgress =
        item as Record<string, unknown>;

      if (
        !["number", "string"].includes(typeof activityProgress.lessonId)
      ) {
        return;
      }

      const activities =
        activitiesByLesson.get(
          String(activityProgress.lessonId)
        ) ?? new Set<number>();

      uniqueIds(
        activityProgress.activities
      ).forEach((activity) => {
        const index = Number(activity);
        if (Number.isSafeInteger(index) && index >= 0) activities.add(index);
      });

      activitiesByLesson.set(
        String(activityProgress.lessonId),
        activities
      );
    });
  }

  return {
    lessonsStarted:
      uniqueIds(stored.lessonsStarted),
    lessonsCompleted:
      uniqueIds(stored.lessonsCompleted),
    activitiesCompleted: [
      ...activitiesByLesson.entries(),
    ].map(([lessonId, activities]) => ({
      lessonId,
      activities: [
        ...activities,
      ].sort((a, b) => a - b),
    })),
  };
}

export function loadUserProgress(): UserProgress {
  const value = localStorage.getItem(KEY);

  if (!value) {
    return normalizeProgress(defaultProgress);
  }

  try {
    return normalizeProgress(
      JSON.parse(value)
    );
  } catch {
    return normalizeProgress(defaultProgress);
  }
}

export function saveUserProgress(
  progress: UserProgress
) {
  localStorage.setItem(
    KEY,
    JSON.stringify(
      normalizeProgress(progress)
    )
  );
}
