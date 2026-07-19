import { describe, expect, it } from "vitest";

import type {
  DecimalContentId,
  PublishedCatalogRpcEnvelope,
  PublishedLessonRpcEnvelope,
} from "../contracts/publishedRpc";
import type { LearnerSupabaseGateway } from "../gateways/LearnerSupabaseGateway";
import { infrastructureFailure } from "../infrastructure/learnerInfrastructureErrors";
import { createLearnerApiService } from "./LearnerApiService";

const id = (value: string) =>
  value as DecimalContentId;

const catalog: PublishedCatalogRpcEnvelope = {
  schemaVersion: 1,
  catalogRevision: "catalog-1",
  generatedAt: "2026-07-19T00:00:00Z",
  courses: [
    {
      id: id("9007199254740993"),
      slug: "pronunciation",
      title: "Pronunciation",
      description: "Course",
      level: "A1",
      emoji: "🎙️",
      position: 0,
      units: [
        {
          id: id("2"),
          courseId: id("9007199254740993"),
          title: "Vowels",
          description: "Unit",
          position: 0,
          lessons: [
            {
              id: id("3"),
              unitId: id("2"),
              title: "Short I",
              description: "Lesson",
              position: 0,
              currentVersionId: id("4"),
              activityCount: 1,
            },
          ],
        },
      ],
    },
  ],
};

const lesson: PublishedLessonRpcEnvelope = {
  schemaVersion: 1,
  lessonRevision: "lesson-4",
  generatedAt: "2026-07-19T00:00:00Z",
  lesson: {
    id: id("3"),
    unitId: id("2"),
    courseId: id("9007199254740993"),
    title: "Short I",
    description: "Lesson",
    currentVersionId: id("4"),
    versionNumber: 1,
    publishedAt: "2026-07-19T00:00:00Z",
    activities: [],
  },
};

function fakeGateway(
  catalogValue: unknown = catalog,
  lessonValue: unknown = lesson
): LearnerSupabaseGateway {
  return {
    async getPublishedLearningCatalog() {
      return { ok: true, value: catalogValue };
    },
    async getPublishedLesson() {
      return { ok: true, value: lessonValue };
    },
  };
}

describe("LearnerApiService", () => {
  it("delegates to an injected gateway and preserves the signal", async () => {
    const controller = new AbortController();
    let receivedSignal: AbortSignal | undefined;
    const gateway = fakeGateway();
    gateway.getPublishedLearningCatalog =
      async (signal) => {
        receivedSignal = signal;
        return { ok: true, value: catalog };
      };

    const result =
      await createLearnerApiService(
        gateway
      ).getPublishedLearningCatalog(
        controller.signal
      );

    expect(receivedSignal).toBe(controller.signal);
    expect(result).toEqual({
      ok: true,
      value: catalog,
    });
  });

  it("returns a valid typed lesson projection", async () => {
    await expect(
      createLearnerApiService(
        fakeGateway()
      ).getPublishedLesson(id("3"))
    ).resolves.toEqual({
      ok: true,
      value: lesson,
    });
  });

  it.each([
    [{ ...catalog, courses: null }, "catalog"],
    [
      {
        ...lesson,
        lesson: {
          ...lesson.lesson,
          currentVersionId: 4,
        },
      },
      "lesson",
    ],
  ] as const)(
    "rejects a malformed %s projection",
    async (payload, kind) => {
      const service = createLearnerApiService(
        kind === "catalog"
          ? fakeGateway(payload)
          : fakeGateway(catalog, payload)
      );
      const result =
        kind === "catalog"
          ? await service.getPublishedLearningCatalog()
          : await service.getPublishedLesson(id("3"));

      expect(result).toMatchObject({
        ok: false,
        error: { code: "invalid_response" },
      });
    }
  );

  it("normalizes an unexpected thrown gateway failure", async () => {
    const gateway = fakeGateway();
    gateway.getPublishedLearningCatalog =
      async () => {
        throw new Error(
          "sensitive gateway implementation detail"
        );
      };

    const result =
      await createLearnerApiService(
        gateway
      ).getPublishedLearningCatalog();

    expect(result).toMatchObject({
      ok: false,
      error: { code: "unexpected" },
    });
    expect(JSON.stringify(result)).not.toContain(
      "sensitive gateway implementation detail"
    );
  });

  it("handles the explicit lesson not-found envelope", async () => {
    const result =
      await createLearnerApiService(
        fakeGateway(catalog, {
          ...lesson,
          lesson: null,
        })
      ).getPublishedLesson(id("3"));

    expect(result).toMatchObject({
      ok: false,
      error: { code: "not_found" },
    });
  });

  it.each([
    infrastructureFailure(
      "aborted",
      "Cancelled."
    ),
    infrastructureFailure(
      "unavailable",
      "Unavailable.",
      true
    ),
    infrastructureFailure(
      "unexpected",
      "Unexpected."
    ),
  ])(
    "preserves normalized gateway failures",
    async (failure) => {
      const gateway = fakeGateway();
      gateway.getPublishedLearningCatalog =
        async () => failure;

      await expect(
        createLearnerApiService(
          gateway
        ).getPublishedLearningCatalog()
      ).resolves.toEqual(failure);
    }
  );

  it("rejects prohibited answer fields anywhere in a projection", async () => {
    const unsafe = structuredClone(
      lesson
    ) as unknown as {
      lesson: {
        activities: unknown[];
      };
    };
    unsafe.lesson.activities.push({
      id: "5",
      title: "Quiz",
      position: 0,
      required: true,
      type: "quiz",
      assessments: [
        {
          id: "6",
          title: "Quiz",
          questions: [
            {
              id: "7",
              prompt: "Choose",
              position: 0,
              required: true,
              is_correct: true,
              options: [],
            },
          ],
        },
      ],
    });

    const result =
      await createLearnerApiService(
        fakeGateway(catalog, unsafe)
      ).getPublishedLesson(id("3"));

    expect(result).toMatchObject({
      ok: false,
      error: { code: "invalid_response" },
    });
  });

  it("keeps bigint identifiers as decimal strings", async () => {
    const result =
      await createLearnerApiService(
        fakeGateway()
      ).getPublishedLearningCatalog();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.courses[0].id).toBe(
      "9007199254740993"
    );
  });
});
