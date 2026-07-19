export type DecimalContentId = string & {
  readonly __decimalContentId: unique symbol;
};

export type PublishedRpcMedia = {
  id: DecimalContentId;
  kind: "audio" | "image";
  publicPath: string;
  mimeType: string | null;
  altText: string | null;
};

export type PublishedRpcTheoryBlock =
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
      media: PublishedRpcMedia;
      alt: string;
    }
  | {
      type: "audio";
      media: PublishedRpcMedia;
    };

export type PublishedRpcAiMissionConfig = {
  missionTitle: string;
  missionLabel: string;
  cefrLevel:
    | "A1"
    | "A2"
    | "B1"
    | "B2"
    | "C1"
    | "C2";
  goal: string;
  estimatedMinutes: number;
  primarySoundLabel: string;
  primarySoundIpa: string;
  secondarySoundLabel: string;
  secondarySoundIpa: string;
  primaryWords: readonly string[];
  secondaryWords: readonly string[];
  sentences: readonly string[];
  readingText: string;
  supportedTools: readonly (
    | "ChatGPT"
    | "Gemini"
  )[];
  promptLanguage: string;
  feedbackLanguage: string;
  difficultyLabel: string;
  resultFormatVersion: 1;
  teacherInstructions: string;
  studentInstructions: string;
};

export type PublishedRpcQuestion = {
  id: DecimalContentId;
  prompt: string;
  position: number;
  required: boolean;
  options: readonly {
    id: DecimalContentId;
    text: string;
    position: number;
  }[];
};

type PublishedRpcActivityBase = {
  id: DecimalContentId;
  title: string;
  position: number;
  required: boolean;
};

export type PublishedRpcActivity =
  | (PublishedRpcActivityBase & {
      type: "theory";
      blocks: readonly PublishedRpcTheoryBlock[];
    })
  | (PublishedRpcActivityBase & {
      type: "listening";
      items: readonly {
        id: DecimalContentId;
        title: string;
        instructions: string | null;
        transcript: string | null;
        audio: PublishedRpcMedia | null;
        questions: readonly PublishedRpcQuestion[];
      }[];
    })
  | (PublishedRpcActivityBase & {
      type: "pronunciation";
      items: readonly {
        id: DecimalContentId;
        title: string;
        instructions: string | null;
        displayText: string;
        audio: PublishedRpcMedia | null;
      }[];
    })
  | (PublishedRpcActivityBase & {
      type: "practice";
      items: readonly {
        id: DecimalContentId;
        title: string;
        instructions: string | null;
      }[];
    })
  | (PublishedRpcActivityBase & {
      type: "quiz";
      assessments: readonly {
        id: DecimalContentId;
        title: string;
        questions: readonly PublishedRpcQuestion[];
      }[];
    })
  | (PublishedRpcActivityBase & {
      type: "ai_speaking_mission";
      missionId: DecimalContentId;
      config: Readonly<PublishedRpcAiMissionConfig>;
    });

export type PublishedRpcLessonSummary = {
  id: DecimalContentId;
  unitId: DecimalContentId;
  title: string;
  description: string;
  position: number;
  currentVersionId: DecimalContentId;
  activityCount: number;
};

export type PublishedRpcUnit = {
  id: DecimalContentId;
  courseId: DecimalContentId;
  title: string;
  description: string;
  position: number;
  lessons: readonly PublishedRpcLessonSummary[];
};

export type PublishedRpcCourse = {
  id: DecimalContentId;
  slug: string;
  title: string;
  description: string;
  level: string;
  emoji: string;
  position: number;
  units: readonly PublishedRpcUnit[];
};

export type PublishedCatalogRpcEnvelope = {
  schemaVersion: 1;
  catalogRevision: string;
  generatedAt: string;
  courses: readonly PublishedRpcCourse[];
};

export type PublishedRpcLesson = {
  id: DecimalContentId;
  unitId: DecimalContentId;
  courseId: DecimalContentId;
  title: string;
  description: string;
  currentVersionId: DecimalContentId;
  versionNumber: number;
  publishedAt: string;
  activities: readonly PublishedRpcActivity[];
};

export type PublishedLessonRpcEnvelope = {
  schemaVersion: 1;
  lessonRevision: string;
  generatedAt: string;
  lesson: PublishedRpcLesson | null;
};
