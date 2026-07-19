import {
  describe,
  expect,
  it,
} from "vitest";

import { courseRegistry } from "../../data/courseRegistry";
import {
  contentIdFromStaticNumber,
} from "../contracts/learnerContent";
import { mapStaticContent } from "./staticContentMapper";

function mutableSource() {
  return structuredClone(courseRegistry);
}

describe("staticContentMapper", () => {
  it("maps safe numeric fixture IDs to opaque stable strings", () => {
    expect(contentIdFromStaticNumber(3)).toBe(
      "3"
    );
    expect(
      contentIdFromStaticNumber(
        Number.MAX_SAFE_INTEGER + 1
      )
    ).toBeNull();
  });

  it("preserves course, unit, lesson, and activity ordering", () => {
    const result = mapStaticContent(
      courseRegistry
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(
      result.value.courses.map(
        (course) => course.id
      )
    ).toEqual(["1"]);
    expect(
      result.value.courses[0].units.map(
        (unit) => unit.id
      )
    ).toEqual(["1", "2", "3"]);
    expect(
      result.value.unitsById
        .get(contentIdFromStaticNumber(1)!)!
        .lessons.map((lesson) => lesson.id)
    ).toEqual(["1", "2"]);
    expect(
      result.value.lessonsById
        .get(contentIdFromStaticNumber(3)!)!
        .activities.map(
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
  });

  it("rejects duplicate unit references within a course", () => {
    const source = mutableSource();
    source.courses[0].units = [1, 1];

    expect(mapStaticContent(source)).toMatchObject({
      ok: false,
      error: {
        code: "invalid_data",
      },
    });
  });

  it("rejects duplicate lesson references within a unit", () => {
    const source = mutableSource();
    source.units[0].lessons = [1, 1];

    expect(mapStaticContent(source)).toMatchObject({
      ok: false,
      error: {
        code: "invalid_data",
      },
    });
  });

  it("keeps missing hierarchy references invalid", () => {
    const source = mutableSource();
    source.courses[0].units = [999];

    expect(mapStaticContent(source)).toMatchObject({
      ok: false,
      error: {
        code: "invalid_data",
      },
    });
  });

  it("removes answer keys and explanations from learner quiz DTOs", () => {
    const result = mapStaticContent(
      courseRegistry
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const lesson =
      result.value.lessonsById.get(
        contentIdFromStaticNumber(1)!
      )!;
    const quiz = lesson.activities.find(
      (activity) => activity.type === "quiz"
    );

    expect(quiz?.type).toBe("quiz");
    const serialized = JSON.stringify(quiz);
    expect(serialized).not.toContain(
      "correctAnswer"
    );
    expect(serialized).not.toContain(
      "isCorrect"
    );
    expect(serialized).not.toContain(
      "explanation"
    );
  });

  it("maps practice as truthful metadata only", () => {
    const result = mapStaticContent(
      courseRegistry
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const practice =
      result.value.lessonsById
        .get(contentIdFromStaticNumber(2)!)!
        .activities.find(
          (activity) =>
            activity.type === "practice"
        );

    expect(practice).toMatchObject({
      type: "practice",
      delivery: "metadata-only",
    });
    expect(JSON.stringify(practice)).not.toContain(
      "questions"
    );
  });

  it("preserves Lesson 3 mission activity identity and validated configuration", () => {
    const result = mapStaticContent(
      courseRegistry
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const mission =
      result.value.lessonsById
        .get(contentIdFromStaticNumber(3)!)!
        .activities.find(
          (activity) =>
            activity.type ===
            "ai_speaking_mission"
        );

    expect(mission).toMatchObject({
      id: "5",
      type: "ai_speaking_mission",
      config: {
        resultFormatVersion: 1,
      },
    });
  });

  it("returns invalid_data for missing subtype content", () => {
    const source = mutableSource();
    source.lessonData[1].theory = [];

    const result = mapStaticContent(source);

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: "invalid_data",
      },
    });
  });

  it("returns invalid_data for unsupported activity types", () => {
    const source = mutableSource();
    source.lessonData[1].activities[0] = {
      ...source.lessonData[1].activities[0],
      type: "video" as never,
    };

    const result = mapStaticContent(source);

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: "invalid_data",
      },
    });
  });

  it("rejects malformed AI mission configuration", () => {
    const source = mutableSource();
    source.lessonData[3].aiMissions![0] = {
      ...source.lessonData[3].aiMissions![0],
      resultFormatVersion: 2,
    };

    const result = mapStaticContent(source);

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: "invalid_data",
      },
    });
  });

  it.each([
    ["promptLanguage", "   "],
    ["feedbackLanguage", ""],
    ["teacherInstructions", "x".repeat(5001)],
  ] as const)(
    "rejects malformed AI mission %s at the mapper boundary",
    (field, value) => {
      const source = mutableSource();
      source.lessonData[3].aiMissions![0] = {
        ...source.lessonData[3].aiMissions![0],
        [field]: value,
      };

      expect(mapStaticContent(source)).toMatchObject({
        ok: false,
        error: {
          code: "invalid_data",
        },
      });
    }
  );
});
