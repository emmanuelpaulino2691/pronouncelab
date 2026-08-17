import type { LessonActivityType } from "../../shared/types/LessonActivity";
import type { LessonState } from "../../shared/types/LessonState";

const activityDetails: Record<LessonActivityType, { label: string; instruction: string; minutes: number }> = {
  theory: { label: "Theory", instruction: "Learn the key idea before you practice.", minutes: 4 },
  listening: { label: "Listening", instruction: "Listen carefully and complete each check.", minutes: 5 },
  pronunciation: { label: "Pronunciation", instruction: "Say each example slowly and clearly.", minutes: 5 },
  practice: { label: "Word Practice", instruction: "Apply what you learned in focused practice.", minutes: 6 },
  quiz: { label: "Lesson Review", instruction: "Check your understanding before you finish.", minutes: 5 },
  ai_speaking_mission: { label: "AI Speaking Mission", instruction: "Complete the final speaking challenge with an external AI coach.", minutes: 9 },
};

export function getActivityDetails(type: LessonActivityType) {
  return activityDetails[type] ?? { label: "Activity", instruction: "Complete this lesson step.", minutes: 5 };
}

export function calculateProgress(completedCount: number, total: number) {
  if (!Number.isFinite(total) || total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((completedCount / total) * 100)));
}

export function estimateRemainingMinutes(activities: readonly { type: LessonActivityType }[], currentIndex: number) {
  if (!activities.length || currentIndex < 0 || currentIndex >= activities.length) return null;
  return activities.slice(currentIndex).reduce((total, activity) => total + getActivityDetails(activity.type).minutes, 0);
}

export function estimateTotalMinutes(activities: readonly { type: LessonActivityType }[]) {
  if (!activities.length) return null;
  return activities.reduce((total, activity) => total + getActivityDetails(activity.type).minutes, 0);
}

export function normalizeLessonState(value: LessonState | null, total: number): LessonState {
  if (!Number.isSafeInteger(total) || total <= 0) return { currentActivity: 0, completedActivities: [] };
  const current = Number.isSafeInteger(value?.currentActivity)
    && (value?.currentActivity ?? -1) >= 0
    && (value?.currentActivity ?? total) < total
    ? value?.currentActivity ?? 0
    : 0;
  const completed = Array.isArray(value?.completedActivities)
    ? [...new Set(value.completedActivities.filter((index) => Number.isSafeInteger(index) && index >= 0 && index < total))].sort((a, b) => a - b)
    : [];
  return { currentActivity: current, completedActivities: completed };
}

export function getCompletionMessage(completedCount: number, total: number) {
  const remaining = Math.max(0, total - completedCount);
  if (remaining === 0) return "All lesson activities are complete.";
  if (completedCount * 2 === total) return "You are halfway through this lesson.";
  if (remaining === 1) return "One activity remains.";
  if (remaining === 2) return "Only two activities remain.";
  return "Activity completed. Keep going.";
}
