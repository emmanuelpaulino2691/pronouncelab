export type LearnerRuntimeMode = "learner" | "teacher_preview";

export function isPreviewMode(mode: LearnerRuntimeMode): boolean {
  return mode === "teacher_preview";
}

export function shouldPersistLearnerMutation(mode: LearnerRuntimeMode): boolean {
  return mode === "learner";
}
