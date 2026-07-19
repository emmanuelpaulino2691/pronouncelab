import { describe, expect, it } from "vitest";

import { defaultAiSpeakingMission } from "../../../features/ai-missions";
import {
  isDecimalContentId,
  isPublishedLessonRpcEnvelope,
} from "./publishedRpcGuards";

const audio = {
  id: "20",
  kind: "audio",
  publicPath: "published/audio.mp3",
  mimeType: "audio/mpeg",
  altText: null,
};

const question = {
  id: "30",
  prompt: "Choose an option.",
  position: 0,
  required: true,
  options: [
    {
      id: "31",
      text: "ship",
      position: 0,
    },
  ],
};

const validLessonEnvelope = {
  schemaVersion: 1,
  lessonRevision: "lesson-4",
  generatedAt: "2026-07-19T00:00:00Z",
  lesson: {
    id: "1",
    unitId: "2",
    courseId: "3",
    title: "Complete lesson",
    description: "Every activity subtype",
    currentVersionId: "4",
    versionNumber: 1,
    publishedAt: "2026-07-19T00:00:00Z",
    activities: [
      {
        id: "5",
        title: "Theory",
        position: 0,
        required: true,
        type: "theory",
        blocks: [
          {
            type: "heading",
            level: 2,
            text: "Sound focus",
          },
          {
            type: "audio",
            media: audio,
          },
        ],
      },
      {
        id: "6",
        title: "Listening",
        position: 1,
        required: true,
        type: "listening",
        items: [
          {
            id: "21",
            title: "Listen",
            instructions: null,
            transcript: "ship",
            audio,
            questions: [question],
          },
        ],
      },
      {
        id: "7",
        title: "Pronunciation",
        position: 2,
        required: true,
        type: "pronunciation",
        items: [
          {
            id: "22",
            title: "Repeat",
            instructions: "Speak clearly.",
            displayText: "ship",
            audio,
          },
        ],
      },
      {
        id: "8",
        title: "Practice",
        position: 3,
        required: false,
        type: "practice",
        items: [
          {
            id: "23",
            title: "Practice",
            instructions: null,
          },
        ],
      },
      {
        id: "9",
        title: "Quiz",
        position: 4,
        required: true,
        type: "quiz",
        assessments: [
          {
            id: "24",
            title: "Check",
            questions: [question],
          },
        ],
      },
      {
        id: "10",
        title: "AI mission",
        position: 5,
        required: false,
        type: "ai_speaking_mission",
        missionId: "25",
        config: defaultAiSpeakingMission,
      },
    ],
  },
};

type MutableObject = Record<string, unknown>;
type MutableEnvelope = {
  lesson: {
    activities: MutableObject[];
  };
};

function nestedObjects(
  value: MutableObject,
  key: string
) {
  return value[key] as MutableObject[];
}

function activity(
  value: MutableEnvelope,
  index: number
) {
  return value.lesson.activities[index]!;
}

function changed(
  mutate: (value: MutableEnvelope) => void
) {
  const value = structuredClone(
    validLessonEnvelope
  ) as unknown as MutableEnvelope;
  mutate(value);
  return value;
}

describe("published RPC guards", () => {
  it.each([
    "1",
    "9007199254740993",
    "9223372036854775807",
  ])(
    "accepts canonical positive bigint ID %s without conversion",
    (value) => {
      expect(isDecimalContentId(value)).toBe(true);
      expect(typeof value).toBe("string");
    }
  );

  it.each([
    "0",
    "9223372036854775808",
    "-1",
    "1.5",
    "1e3",
    " 1",
    "1 ",
    "01",
    "",
  ])("rejects invalid bigint ID %j", (value) => {
    expect(isDecimalContentId(value)).toBe(false);
  });

  it("accepts a complete lesson with every activity subtype", () => {
    expect(
      isPublishedLessonRpcEnvelope(
        validLessonEnvelope
      )
    ).toBe(true);
  });

  it.each([
    [
      "theory block discriminant",
      (value: MutableEnvelope) => {
        nestedObjects(
          activity(value, 0),
          "blocks"
        )[0]!.type = "video";
      },
    ],
    [
      "listening media",
      (value: MutableEnvelope) => {
        nestedObjects(
          activity(value, 1),
          "items"
        )[0]!.audio = {
          ...audio,
          id: "01",
        };
      },
    ],
    [
      "pronunciation media",
      (value: MutableEnvelope) => {
        nestedObjects(
          activity(value, 2),
          "items"
        )[0]!.audio = {
          ...audio,
          kind: "image",
        };
      },
    ],
    [
      "practice metadata",
      (value: MutableEnvelope) => {
        nestedObjects(
          activity(value, 3),
          "items"
        )[0]!.title = undefined;
      },
    ],
    [
      "quiz assessment",
      (value: MutableEnvelope) => {
        nestedObjects(
          activity(value, 4),
          "assessments"
        )[0] = {};
      },
    ],
    [
      "quiz question",
      (value: MutableEnvelope) => {
        const assessment = nestedObjects(
          activity(value, 4),
          "assessments"
        )[0]!;
        nestedObjects(
          assessment,
          "questions"
        )[0] = {
          ...question,
          prompt: undefined,
        };
      },
    ],
    [
      "quiz option ID",
      (value: MutableEnvelope) => {
        const assessment = nestedObjects(
          activity(value, 4),
          "assessments"
        )[0]!;
        const quizQuestion = nestedObjects(
          assessment,
          "questions"
        )[0]!;
        nestedObjects(
          quizQuestion,
          "options"
        )[0]!.id = "not-an-id";
      },
    ],
    [
      "AI mission configuration",
      (value: MutableEnvelope) => {
        activity(value, 5).config = {
          ...defaultAiSpeakingMission,
          promptLanguage: "",
        };
      },
    ],
    [
      "nested activity ID",
      (value: MutableEnvelope) => {
        nestedObjects(
          activity(value, 1),
          "items"
        )[0]!.id = "9223372036854775808";
      },
    ],
  ] as const)(
    "rejects malformed %s",
    (_label, mutate) => {
      expect(
        isPublishedLessonRpcEnvelope(
          changed(mutate)
        )
      ).toBe(false);
    }
  );
});
