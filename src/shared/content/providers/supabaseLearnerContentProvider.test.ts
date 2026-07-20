import { describe, expect, it } from "vitest";

import type { LearnerApiService } from "../api/LearnerApiService";
import type {
  DecimalContentId,
  PublishedCatalogRpcEnvelope,
  PublishedLessonRpcEnvelope,
} from "../contracts/publishedRpc";
import { contentIdFromStaticNumber } from "../contracts/learnerContent";
import type { ContentId } from "../contracts/learnerContent";
import { infrastructureFailure } from "../infrastructure/learnerInfrastructureErrors";
import { createSupabaseLearnerContentProvider } from "./supabaseLearnerContentProvider";

const catalog: PublishedCatalogRpcEnvelope = {
  schemaVersion: 1,
  catalogRevision: "catalog-1",
  generatedAt: "2026-07-19T00:00:00Z",
  courses: [
    {
      id: "1" as DecimalContentId,
      slug: "course",
      title: "Course",
      description: "",
      level: "A1",
      emoji: "",
      position: 0,
      units: [
        {
          id: "2" as DecimalContentId,
          courseId: "1" as DecimalContentId,
          title: "Unit",
          description: "",
          position: 0,
          lessons: [
            {
              id: "3" as DecimalContentId,
              unitId: "2" as DecimalContentId,
              title: "Lesson",
              description: "",
              position: 0,
              currentVersionId:
                "4" as DecimalContentId,
              activityCount: 0,
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
    id: "3" as DecimalContentId,
    unitId: "2" as DecimalContentId,
    courseId: "1" as DecimalContentId,
    title: "Lesson",
    description: "",
    currentVersionId: "4" as DecimalContentId,
    versionNumber: 1,
    publishedAt: "2026-07-19T00:00:00Z",
    activities: [],
  },
};

function api(): LearnerApiService {
  return {
    async getPublishedLearningCatalog() {
      return { ok: true, value: catalog };
    },
    async getPublishedLesson() {
      return { ok: true, value: lesson };
    },
  };
}

const id = (value: number) =>
  contentIdFromStaticNumber(value)!;

describe("supabaseLearnerContentProvider", () => {
  it("implements all catalog and lesson methods through the API service", async () => {
    const provider =
      createSupabaseLearnerContentProvider(
        api()
      );

    await expect(
      provider.listCourses()
    ).resolves.toMatchObject({
      ok: true,
      value: [{ id: "1" }],
    });
    await expect(
      provider.getCourse(id(1))
    ).resolves.toMatchObject({
      ok: true,
      value: { id: "1" },
    });
    await expect(
      provider.listUnits(id(1))
    ).resolves.toMatchObject({
      ok: true,
      value: [{ id: "2" }],
    });
    await expect(
      provider.getUnit(id(2))
    ).resolves.toMatchObject({
      ok: true,
      value: { id: "2" },
    });
    await expect(
      provider.listLessons(id(2))
    ).resolves.toMatchObject({
      ok: true,
      value: [{ id: "3" }],
    });
    await expect(
      provider.getLesson(id(3))
    ).resolves.toMatchObject({
      ok: true,
      value: {
        id: "3",
        metadata: { source: "supabase" },
      },
    });
  });

  it("returns not-found without static fallback", async () => {
    const provider =
      createSupabaseLearnerContentProvider(
        api()
      );
    await expect(
      provider.getCourse(id(999))
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "not_found" },
    });
    await expect(
      provider.getLesson(id(999))
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "invalid_data" },
    });
  });

  it.each([
    ["not_found", "not_found"],
    ["unavailable", "unavailable"],
    ["aborted", "aborted"],
    ["invalid_response", "invalid_data"],
  ] as const)(
    "normalizes %s API failures as %s",
    async (apiCode, contentCode) => {
      const fake = api();
      fake.getPublishedLesson = async () =>
        infrastructureFailure(
          apiCode,
          "Internal detail.",
          apiCode === "unavailable"
        );
      const result =
        await createSupabaseLearnerContentProvider(
          fake
        ).getLesson(id(3));

      expect(result).toMatchObject({
        ok: false,
        error: { code: contentCode },
      });
      expect(JSON.stringify(result)).not.toContain(
        "Internal detail"
      );
    }
  );

  it("propagates AbortSignal to the API service", async () => {
    const controller = new AbortController();
    let received: AbortSignal | undefined;
    const fake = api();
    fake.getPublishedLearningCatalog =
      async (signal) => {
        received = signal;
        return infrastructureFailure(
          "aborted",
          "Cancelled."
        );
      };

    await createSupabaseLearnerContentProvider(
      fake
    ).listCourses(controller.signal);
    expect(received).toBe(controller.signal);
  });

  it.each([
    "0",
    "01",
    "9223372036854775808",
    "not-an-id",
    "123e4567-e89b-42d3-a456-426614174000",
  ])(
    "rejects invalid Supabase lesson ID %s before calling the API",
    async (invalidId) => {
      let calls = 0;
      const fake = api();
      fake.getPublishedLesson = async () => {
        calls += 1;
        return { ok: true, value: lesson };
      };

      const result =
        await createSupabaseLearnerContentProvider(
          fake
        ).getLesson(invalidId as ContentId);

      expect(result).toMatchObject({
        ok: false,
        error: { code: "not_found" },
      });
      expect(calls).toBe(0);
    }
  );

  it("returns defensive copies across requests", async () => {
    const provider =
      createSupabaseLearnerContentProvider(
        api()
      );
    const first = await provider.getCourse(id(1));
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    (
      first.value.units as unknown as {
        title: string;
      }[]
    )[0].title = "Changed";

    const second = await provider.getCourse(id(1));
    expect(second).toMatchObject({
      ok: true,
      value: {
        units: [{ title: "Unit" }],
      },
    });
  });
});
