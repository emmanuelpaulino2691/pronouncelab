export const activityEditorLoaders = {
  theory: () => import("./TheoryEditor"),
  listening: () => import("./ListeningEditor"),
  pronunciation: () => import("./PronunciationEditor"),
  practice: () => import("./LegacyPracticeEditor"),
  quiz: () => import("./QuizEditor"),
  interactive_practice: () => import("./InteractivePracticeEditor"),
  ai_speaking_mission: () => import("./AiSpeakingMissionEditor"),
} as const;

export type LazyActivityEditorType = keyof typeof activityEditorLoaders;
