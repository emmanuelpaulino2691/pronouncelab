export const aiMissionFormatVersion = 1 as const;
export const cefrLevels = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type CefrLevel = (typeof cefrLevels)[number];
export type AiMissionProvider = "ChatGPT" | "Gemini";

export type AiSpeakingMissionData = {
  missionTitle: string;
  missionLabel: string;
  cefrLevel: CefrLevel;
  goal: string;
  estimatedMinutes: number;
  primarySoundLabel: string;
  primarySoundIpa: string;
  secondarySoundLabel: string;
  secondarySoundIpa: string;
  primaryWords: string[];
  secondaryWords: string[];
  sentences: string[];
  readingText: string;
  supportedTools: AiMissionProvider[];
  promptLanguage: string;
  feedbackLanguage: string;
  difficultyLabel: string;
  resultFormatVersion: number;
  teacherInstructions: string;
  studentInstructions: string;
};

export type ParsedAiMissionResult = {
  formatVersion: number | null;
  mission: string;
  score: number | null;
  wordsToPracticeAgain: string[];
  pronunciationFeedback: string;
  strengths: string[];
  goalForNextPractice: string;
  coachMessage: string;
  warnings: string[];
  rawText: string;
};

export type AiMissionJournalEntry = {
  missionId: number;
  lessonId: number;
  courseId: number;
  studentId: string;
  externalProvider: AiMissionProvider;
  score: number | null;
  wordsToPracticeAgain: string[];
  feedback: string;
  strengths: string[];
  nextGoal: string;
  coachMessage: string;
  rawPastedResult: string;
  submittedAt: string;
  parserFormatVersion: number;
};

export const defaultAiSpeakingMission: AiSpeakingMissionData = {
  missionTitle: "Short I and Long E Mission",
  missionLabel: "Mission 1",
  cefrLevel: "A1",
  goal: "Practice the contrast clearly and receive supportive pronunciation feedback.",
  estimatedMinutes: 9,
  primarySoundLabel: "Short I",
  primarySoundIpa: "/ɪ/",
  secondarySoundLabel: "Long E",
  secondarySoundIpa: "/iː/",
  primaryWords: ["ship", "sit", "live", "fill", "hit", "bit", "lip", "chip", "rich", "pick"],
  secondaryWords: ["sheep", "seat", "leave", "feel", "heat", "beat", "leap", "cheap", "reach", "peak"],
  sentences: [
    "The ship will leave at six.",
    "Please sit in the green seat.",
    "I feel the heat on my feet.",
  ],
  readingText: "Tim lives near the sea. Each week, he visits the beach and sits beneath a green tree. He listens to the ships and feels the cool breeze.",
  supportedTools: ["ChatGPT", "Gemini"],
  promptLanguage: "English",
  feedbackLanguage: "English",
  difficultyLabel: "Beginner",
  resultFormatVersion: aiMissionFormatVersion,
  teacherInstructions: "",
  studentInstructions: "Use voice mode. Read each item aloud and wait for the coach to guide you.",
};
