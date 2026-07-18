export const activityTypes = [
  "theory",
  "listening",
  "pronunciation",
  "practice",
  "quiz",
  "ai_speaking_mission",
] as const;

export type ActivityType =
  (typeof activityTypes)[number];

export const activityTypeLabels: Record<
  ActivityType,
  string
> = {
  theory: "Theory",
  listening: "Listening",
  pronunciation: "Pronunciation",
  practice: "Practice",
  quiz: "Quiz",
  ai_speaking_mission: "AI Speaking Mission",
};

export type LessonVersionStatus =
  | "draft"
  | "published"
  | "archived";

export type LessonVersion = {
  id: number;
  lessonId: number;
  versionNumber: number;
  status: LessonVersionStatus;
};

export type LessonActivity = {
  id: number;
  lessonVersionId: number;
  type: ActivityType;
  title: string;
  position: number;
  required: boolean;
  updatedAt: string;
};

export type TheoryBlockType =
  | "heading"
  | "paragraph"
  | "tip"
  | "example"
  | "image"
  | "audio";

export type TheoryBlock = {
  id: number;
  activityId: number;
  blockType: TheoryBlockType;
  position: number;
  headingLevel: number | null;
  title: string | null;
  text: string | null;
  mediaAssetId: string | null;
  altText: string | null;
  updatedAt: string;
};

export type ListeningItem = {
  id: number;
  activityId: number;
  title: string;
  instructions: string | null;
  transcript: string | null;
  audioAssetId: string | null;
  position: number;
  updatedAt: string;
};

export type PronunciationItem = {
  id: number;
  activityId: number;
  title: string;
  instructions: string | null;
  displayText: string;
  audioAssetId: string | null;
  position: number;
  updatedAt: string;
};

export type QuestionOption = {
  id: number;
  questionId: number;
  text: string;
  position: number;
  isCorrect: boolean;
};

export type QuizQuestion = {
  id: number;
  assessmentSetId: number;
  prompt: string;
  explanation: string | null;
  position: number;
  required: boolean;
  updatedAt: string;
  options: QuestionOption[];
};

export type AssessmentSet = {
  id: number;
  activityId: number;
  title: string;
  instructions: string | null;
  position: number;
  updatedAt: string;
};
