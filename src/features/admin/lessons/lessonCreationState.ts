export type LessonCreationStage = "choice" | "blank-form";
export type LessonCreationOption = "blank" | "template";

export function getInitialLessonCreationStage(): LessonCreationStage {
  return "choice";
}

export function chooseBlankLesson(): LessonCreationStage {
  return "blank-form";
}

export function returnToLessonChoice(): LessonCreationStage {
  return "choice";
}

export function canChooseLessonCreationOption(
  option: LessonCreationOption
): boolean {
  return option === "blank";
}

export function canStartLessonCreation(
  isSubmitting: boolean,
  hasCompletedCreation: boolean
): boolean {
  return !isSubmitting && !hasCompletedCreation;
}
