import { describe, expect, it } from "vitest";

import { defaultAiSpeakingMission } from "../../../features/ai-missions";
import {
  mapPublishedCatalog,
  mapPublishedLesson,
} from "./publishedContentMapper";

const media = {
  id: "123e4567-e89b-42d3-a456-426614174000",
  kind: "audio",
  publicPath: "content-audio/ship.mp3",
  mimeType: "audio/mpeg",
  altText: null,
};

const question = {
  id: "31",
  prompt: "Choose ship.",
  position: 0,
  required: true,
  options: [
    { id: "32", text: "ship", position: 0 },
  ],
};

const populatedCatalog = {
  schemaVersion: 1,
  catalogRevision: "catalog-1",
  generatedAt: "2026-07-19T00:00:00Z",
  courses: [
    {
      id: "9007199254740993",
      slug: "second",
      title: "Second",
      description: "",
      level: "A2",
      emoji: "2",
      position: 1,
      units: [],
    },
    {
      id: "1",
      slug: "first",
      title: "First",
      description: "",
      level: "A1",
      emoji: "1",
      position: 0,
      units: [
        {
          id: "2",
          courseId: "1",
          title: "Unit",
          description: "",
          position: 0,
          lessons: [
            {
              id: "3",
              unitId: "2",
              title: "Later",
              description: "",
              position: 1,
              currentVersionId: "5",
              activityCount: 0,
            },
            {
              id: "4",
              unitId: "2",
              title: "Earlier",
              description: "",
              position: 0,
              currentVersionId: "6",
              activityCount: 2,
            },
          ],
        },
      ],
    },
  ],
};

const completeLesson = {
  schemaVersion: 1,
  lessonRevision: "version-9",
  generatedAt: "2026-07-19T00:00:00Z",
  lesson: {
    id: "3",
    unitId: "2",
    courseId: "1",
    title: "Complete",
    description: "All activities",
    currentVersionId: "9",
    versionNumber: 2,
    publishedAt: "2026-07-19T00:00:00Z",
    activities: [
      {
        id: "10",
        title: "Quiz",
        position: 5,
        required: true,
        type: "quiz",
        assessments: [
          {
            id: "30",
            title: "Check",
            position: 0,
            questions: [question],
          },
        ],
      },
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
            text: "Focus",
          },
          { type: "audio", media },
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
            id: "20",
            title: "Listen",
            position: 0,
            instructions: null,
            transcript: "ship",
            audio: media,
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
            id: "21",
            title: "Repeat",
            position: 0,
            instructions: null,
            displayText: "ship",
            audio: media,
          },
        ],
      },
      {
        id: "8",
        title: "Practice",
        position: 3,
        required: false,
        type: "practice",
        items: [],
      },
      {
        id: "9",
        title: "Mission",
        position: 4,
        required: false,
        type: "ai_speaking_mission",
        missionId: "22",
        config: defaultAiSpeakingMission,
      },
    ],
  },
};

describe("publishedContentMapper", () => {
  it("maps a valid empty catalog", () => {
    expect(
      mapPublishedCatalog({
        schemaVersion: 1,
        catalogRevision: "empty",
        generatedAt: "2026-07-19T00:00:00Z",
        courses: [],
      })
    ).toMatchObject({
      ok: true,
      value: { courses: [] },
      revision: "empty",
    });
  });

  it("maps and defensively orders a populated catalog with large IDs", () => {
    const result = mapPublishedCatalog(
      populatedCatalog
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(
      result.value.courses.map(
        (course) => course.id
      )
    ).toEqual(["1", "9007199254740993"]);
    expect(
      result.value.unitsById
        .get("2" as never)!
        .lessons.map((lesson) => lesson.id)
    ).toEqual(["4", "3"]);
    expect(
      result.value.courses[0].unitCount
    ).toBe(1);
  });

  it.each([
    [
      "duplicate course",
      (value: typeof populatedCatalog) => {
        value.courses.push(
          structuredClone(value.courses[0])
        );
      },
    ],
    [
      "duplicate unit",
      (value: typeof populatedCatalog) => {
        value.courses[1].units.push(
          structuredClone(
            value.courses[1].units[0]
          )
        );
      },
    ],
    [
      "duplicate lesson",
      (value: typeof populatedCatalog) => {
        value.courses[1].units[0].lessons.push(
          structuredClone(
            value.courses[1].units[0].lessons[0]
          )
        );
      },
    ],
    [
      "unit parent mismatch",
      (value: typeof populatedCatalog) => {
        value.courses[1].units[0].courseId = "2";
      },
    ],
    [
      "lesson parent mismatch",
      (value: typeof populatedCatalog) => {
        value.courses[1].units[0].lessons[0].unitId =
          "3";
      },
    ],
  ] as const)(
    "rejects %s catalog identity",
    (_label, mutate) => {
      const value = structuredClone(
        populatedCatalog
      );
      mutate(value);
      expect(mapPublishedCatalog(value)).toMatchObject({
        ok: false,
        error: { code: "invalid_data" },
      });
    }
  );

  it("maps published metadata and every activity subtype without answer keys", () => {
    const result = mapPublishedLesson(
      completeLesson
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.metadata).toEqual({
      source: "supabase",
      lessonId: "3",
      lessonVersionId: "9",
      versionNumber: 2,
      publishedAt: "2026-07-19T00:00:00Z",
      schemaVersion: 1,
    });
    expect(
      result.value.activities.map(
        (activity) => activity.type
      )
    ).toEqual([
      "theory",
      "listening",
      "pronunciation",
      "practice",
      "ai_speaking_mission",
      "quiz",
    ]);
    const serialized = JSON.stringify(
      result.value
    );
    expect(serialized).not.toContain(
      "correctAnswer"
    );
    expect(serialized).not.toContain(
      "is_correct"
    );
    expect(serialized).not.toContain(
      "explanation"
    );
  });

  it("rejects malformed projections and explicit not-found lessons", () => {
    expect(
      mapPublishedCatalog({
        ...populatedCatalog,
        courses: null,
      })
    ).toMatchObject({
      ok: false,
      error: { code: "invalid_data" },
    });
    expect(
      mapPublishedLesson({
        ...completeLesson,
        lesson: null,
      })
    ).toMatchObject({
      ok: false,
      error: { code: "not_found" },
    });
  });

  it("does not mutate input and returns independent nested values", () => {
    const input = structuredClone(
      completeLesson
    );
    const before = structuredClone(input);
    const result = mapPublishedLesson(input);

    expect(input).toEqual(before);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const mission = result.value.activities.find(
      (activity) =>
        activity.type ===
        "ai_speaking_mission"
    );
    expect(mission?.type).toBe(
      "ai_speaking_mission"
    );
    if (
      mission?.type ===
      "ai_speaking_mission"
    ) {
      expect(mission.config).not.toBe(
        input.lesson.activities[5].config
      );
    }
  });
});
