import {
  describe,
  expect,
  it,
} from "vitest";

import { courseRegistry } from "../../data/courseRegistry";
import { contentIdFromStaticNumber } from "../contracts/learnerContent";
import { contentFailure } from "../errors/contentErrors";
import {
  createStaticLearnerContentProvider,
  staticLearnerContentProvider,
} from "./staticLearnerContentProvider";

const id = (value: number) =>
  contentIdFromStaticNumber(value)!;

describe("staticLearnerContentProvider", () => {
  it("implements the complete asynchronous provider contract", async () => {
    const courses =
      await staticLearnerContentProvider.listCourses();
    const course =
      await staticLearnerContentProvider.getCourse(
        id(1)
      );
    const units =
      await staticLearnerContentProvider.listUnits(
        id(1)
      );
    const unit =
      await staticLearnerContentProvider.getUnit(
        id(2)
      );
    const lessons =
      await staticLearnerContentProvider.listLessons(
        id(2)
      );
    const lesson =
      await staticLearnerContentProvider.getLesson(
        id(3)
      );

    expect(courses).toMatchObject({
      ok: true,
      value: [{ id: "1" }],
    });
    expect(course).toMatchObject({
      ok: true,
      value: { id: "1", unitCount: 3 },
    });
    expect(units).toMatchObject({
      ok: true,
      value: [
        { id: "1" },
        { id: "2" },
        { id: "3" },
      ],
    });
    expect(unit).toMatchObject({
      ok: true,
      value: { id: "2", lessonCount: 1 },
    });
    expect(lessons).toMatchObject({
      ok: true,
      value: [{ id: "3", available: true }],
    });
    expect(lesson).toMatchObject({
      ok: true,
      value: {
        id: "3",
        metadata: { source: "local" },
      },
    });
  });

  it("returns not_found for missing course, unit, and lesson IDs", async () => {
    const missing = id(999);
    const results = await Promise.all([
      staticLearnerContentProvider.getCourse(
        missing
      ),
      staticLearnerContentProvider.getUnit(
        missing
      ),
      staticLearnerContentProvider.getLesson(
        missing
      ),
    ]);

    expect(
      results.map((result) =>
        result.ok ? null : result.error.code
      )
    ).toEqual([
      "not_found",
      "not_found",
      "not_found",
    ]);
  });

  it("returns unavailable when a known lesson has no fixture data", async () => {
    const source = structuredClone(
      courseRegistry
    );
    delete source.lessonData[3];
    const provider =
      createStaticLearnerContentProvider(source);

    const result = await provider.getLesson(
      id(3)
    );

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: "unavailable",
      },
    });
  });

  it("returns invalid_data instead of throwing for malformed fixtures", async () => {
    const source = structuredClone(
      courseRegistry
    );
    source.lessonData[1].theory = [];
    const provider =
      createStaticLearnerContentProvider(source);

    await expect(
      provider.listCourses()
    ).resolves.toMatchObject({
      ok: false,
      error: {
        code: "invalid_data",
      },
    });
  });

  it("returns aborted for a cancelled request", async () => {
    const controller = new AbortController();
    controller.abort();

    const result =
      await staticLearnerContentProvider.listCourses(
        controller.signal
      );

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: "aborted",
        retryable: false,
      },
    });
  });

  it("keeps provider error categories explicit", () => {
    expect(
      contentFailure(
        "unexpected",
        "Unexpected failure.",
        true
      )
    ).toEqual({
      ok: false,
      error: {
        code: "unexpected",
        message: "Unexpected failure.",
        retryable: true,
      },
    });
  });

  it("prevents one result from contaminating later provider results", async () => {
    const first =
      await staticLearnerContentProvider.getLesson(
        id(3)
      );
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const originalTitle =
      first.value.activities[0].title;

    (
      first.value.activities as unknown as Array<{
        title: string;
      }>
    )[0].title = "Mutated title";
    (
      first.value.activities as unknown as Array<unknown>
    ).reverse();

    const second =
      await staticLearnerContentProvider.getLesson(
        id(3)
      );
    expect(second.ok).toBe(true);
    if (!second.ok) return;

    expect(second.value.activities[0]).toMatchObject({
      title: originalTitle,
      position: 0,
    });
    expect(
      second.value.activities.map(
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
});
