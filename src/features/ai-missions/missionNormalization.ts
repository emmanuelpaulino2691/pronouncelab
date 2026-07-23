import type { AiSpeakingMissionData } from "./types";

export function normalizeAiSpeakingMission(
  data: AiSpeakingMissionData
): AiSpeakingMissionData {
  const clean = (items: string[]) =>
    items.map((item) => item.trim()).filter(Boolean);

  return {
    ...data,
    missionTitle: data.missionTitle.trim(),
    missionLabel: data.missionLabel.trim(),
    goal: data.goal.trim(),
    primarySoundLabel: data.primarySoundLabel.trim(),
    primarySoundIpa: data.primarySoundIpa.trim(),
    secondarySoundLabel: data.secondarySoundLabel.trim(),
    secondarySoundIpa: data.secondarySoundIpa.trim(),
    primaryWords: clean(data.primaryWords),
    secondaryWords: clean(data.secondaryWords),
    sentences: clean(data.sentences),
    readingText: data.readingText.trim(),
    promptLanguage: data.promptLanguage.trim(),
    feedbackLanguage: data.feedbackLanguage.trim(),
    difficultyLabel: data.difficultyLabel.trim(),
    teacherInstructions: data.teacherInstructions.trim(),
    studentInstructions: data.studentInstructions.trim(),
    studentInstructionsEs: data.studentInstructionsEs?.trim() || undefined,
  };
}
