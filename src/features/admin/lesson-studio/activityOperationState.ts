import type { ActivityType } from "./types";

const supportedActivityOperations = new Set<ActivityType>(["theory", "listening", "pronunciation", "quiz", "practice", "ai_speaking_mission"]);

export function canOfferActivityOperations(type: ActivityType) {
  return supportedActivityOperations.has(type);
}

export function validDuplicateActivityPosition(position: number, maximum: number) {
  return Number.isInteger(position) && position >= 1 && position <= maximum;
}

export function validCopyActivityInput(input: { sourceLessonId: number; destinationLessonId: number; title: string }) {
  void input.title;
  return input.destinationLessonId > 0 && input.destinationLessonId !== input.sourceLessonId;
}
