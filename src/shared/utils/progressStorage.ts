import type { UserProgress } from "../types/UserProgress";

const KEY = "pronouncelab:user-progress";

const defaultProgress: UserProgress = {
  lessonsStarted: [],
  lessonsCompleted: [],
  activitiesCompleted: [],
};

function uniqueNumbers(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value.filter(
        (item): item is number =>
          typeof item === "number" &&
          Number.isFinite(item)
      )
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
    new Map<number, Set<number>>();

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
        typeof activityProgress.lessonId !==
        "number"
      ) {
        return;
      }

      const activities =
        activitiesByLesson.get(
          activityProgress.lessonId
        ) ?? new Set<number>();

      uniqueNumbers(
        activityProgress.activities
      ).forEach((activity) =>
        activities.add(activity)
      );

      activitiesByLesson.set(
        activityProgress.lessonId,
        activities
      );
    });
  }

  return {
    lessonsStarted:
      uniqueNumbers(stored.lessonsStarted),
    lessonsCompleted:
      uniqueNumbers(stored.lessonsCompleted),
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
