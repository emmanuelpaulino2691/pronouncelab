import type { UserProgress } from "../types/UserProgress";

export type ServerLearnerProgress = {
  lessons: Array<{ lessonId: string; completedAt: string | null; lastAccessedAt: string;lastActivityId:string|null }>;
  activities: Array<{ lessonId: string; activityId: string; position: number; completedAt: string }>;
};

export const emptyServerProgress = (): ServerLearnerProgress => ({ lessons: [], activities: [] });

export function parseServerLearnerProgress(value: unknown): ServerLearnerProgress {
  if (!value || typeof value !== "object") return emptyServerProgress();
  const source = value as Record<string, unknown>;
  const lessons = Array.isArray(source.lessons) ? source.lessons.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    if (!(typeof row.lessonId === "string" || typeof row.lessonId === "number")) return [];
    return [{ lessonId: String(row.lessonId), completedAt: typeof row.completedAt === "string" ? row.completedAt : null, lastAccessedAt: typeof row.lastAccessedAt === "string" ? row.lastAccessedAt : "",lastActivityId:typeof row.lastActivityId==="string"||typeof row.lastActivityId==="number"?String(row.lastActivityId):null }];
  }) : [];
  const activities = Array.isArray(source.activities) ? source.activities.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const position = Number(row.position);
    if (!(typeof row.lessonId === "string" || typeof row.lessonId === "number") || !(typeof row.activityId === "string" || typeof row.activityId === "number") || !Number.isSafeInteger(position) || position < 0) return [];
    return [{ lessonId: String(row.lessonId), activityId: String(row.activityId), position, completedAt: typeof row.completedAt === "string" ? row.completedAt : "" }];
  }) : [];
  return { lessons, activities };
}

export function mergeLearnerProgress(local: UserProgress, server: ServerLearnerProgress): UserProgress {
  const started = new Set(local.lessonsStarted);
  const completed = new Set(local.lessonsCompleted);
  const activities = new Map(local.activitiesCompleted.map((item) => [item.lessonId, new Set(item.activities)]));
  [...server.lessons].sort((a, b) => a.lastAccessedAt.localeCompare(b.lastAccessedAt)).forEach((row) => {
    started.add(row.lessonId);
    if (row.completedAt) completed.add(row.lessonId);
  });
  server.activities.forEach((row) => {
    started.add(row.lessonId);
    const indexes = activities.get(row.lessonId) ?? new Set<number>();
    indexes.add(row.position);
    activities.set(row.lessonId, indexes);
  });
  return {
    lessonsStarted: [...started],
    lessonsCompleted: [...completed],
    activitiesCompleted: [...activities].map(([lessonId, indexes]) => ({ lessonId, activities: [...indexes].sort((a, b) => a - b) })),
  };
}

export function pendingPublishedActivityIds(local: UserProgress, lessonId: string, activities: readonly { id: string }[], server: ServerLearnerProgress) {
  const completedIndexes = local.activitiesCompleted.find((item) => item.lessonId === lessonId)?.activities ?? [];
  const serverIds = new Set(server.activities.map((item) => item.activityId));
  return completedIndexes.flatMap((index) => activities[index] && !serverIds.has(activities[index].id) ? [activities[index].id] : []);
}
