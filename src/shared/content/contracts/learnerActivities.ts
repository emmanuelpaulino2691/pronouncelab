import type { AiSpeakingMissionData } from "../../../features/ai-missions";
import type { ContentId } from "./learnerContent";

export type ReadonlyAiSpeakingMissionData =
  Readonly<
    Omit<
      AiSpeakingMissionData,
      | "primaryWords"
      | "secondaryWords"
      | "sentences"
      | "supportedTools"
    >
  > & {
    readonly primaryWords: readonly string[];
    readonly secondaryWords: readonly string[];
    readonly sentences: readonly string[];
    readonly supportedTools: readonly AiSpeakingMissionData["supportedTools"][number][];
  };

type LearnerActivityBase = {
  readonly id: ContentId;
  readonly title: string;
  readonly position: number;
  readonly required: boolean;
};

export type LearnerMedia = {
  id: ContentId;
  kind: "audio" | "image";
  url: string;
  mimeType: string | null;
  altText: string | null;
};

export type LearnerTheoryBlock =
  | {
      type: "heading";
      level: 1 | 2 | 3;
      text: string;
    }
  | {
      type: "paragraph" | "tip";
      text: string;
    }
  | {
      type: "example";
      title: string;
      text: string;
    }
  | {
      type: "image";
      media: LearnerMedia;
      alt: string;
    }
  | {
      type: "audio";
      media: LearnerMedia;
    };

export type LearnerQuestionOption = {
  readonly id: ContentId;
  readonly text: string;
  readonly position: number;
};

export type LearnerQuestion = {
  readonly id: ContentId;
  readonly prompt: string;
  readonly position: number;
  readonly required: boolean;
  readonly options: readonly LearnerQuestionOption[];
};

export type LearnerTheoryActivity =
  LearnerActivityBase & {
    type: "theory";
    readonly blocks: readonly LearnerTheoryBlock[];
  };

export type LearnerListeningActivity =
  LearnerActivityBase & {
    type: "listening";
    readonly items: readonly {
      id: ContentId;
      title: string;
      instructions: string | null;
      transcript: string | null;
      audio: LearnerMedia | null;
      readonly questions: readonly LearnerQuestion[];
    }[];
  };

export type LearnerPronunciationActivity =
  LearnerActivityBase & {
    type: "pronunciation";
    readonly items: readonly {
      id: ContentId;
      title: string;
      instructions: string | null;
      displayText: string;
      audio: LearnerMedia | null;
    }[];
  };

export type LearnerPracticeActivity =
  LearnerActivityBase & {
    type: "practice";
    delivery: "metadata-only";
    readonly items: readonly {
      id: ContentId;
      title: string;
      instructions: string | null;
    }[];
  };

export type LearnerQuizActivity =
  LearnerActivityBase & {
    type: "quiz";
    scoring: "deferred";
    readonly assessments: readonly {
      id: ContentId;
      title: string;
      readonly questions: readonly LearnerQuestion[];
    }[];
  };

export type LearnerAiMissionActivity =
  LearnerActivityBase & {
    type: "ai_speaking_mission";
    missionId: ContentId;
    readonly config: ReadonlyAiSpeakingMissionData;
  };

export type LearnerActivity =
  | LearnerTheoryActivity
  | LearnerListeningActivity
  | LearnerPronunciationActivity
  | LearnerPracticeActivity
  | LearnerQuizActivity
  | LearnerAiMissionActivity;
