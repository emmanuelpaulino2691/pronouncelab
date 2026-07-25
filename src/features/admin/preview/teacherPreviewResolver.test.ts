import { describe, expect, it, vi } from "vitest";
import { resolveTeacherPreviewLesson } from "./teacherPreviewResolver";
import type { LearnerLesson } from "../../../shared/content/contracts/learnerContent";

const lesson = (title: string) => ({ id: "1", unitId: "2", courseId: "3", title, description: "", metadata: { source: "local", fixtureRevision: "1" }, activities: [] } as unknown as LearnerLesson);
const id = "1" as never;
const sources = (draft?: LearnerLesson, published?: LearnerLesson, local?: LearnerLesson) => ({
  draft: { getLesson: vi.fn(async () => draft ?? null) },
  published: { getLesson: vi.fn(async () => published ? { ok: true as const, value: published } : { ok: false as const, error: { code: "not_found", message: "missing" } }) } as never,
  local: { getLesson: vi.fn(async () => local ? { ok: true as const, value: local } : { ok: false as const, error: { code: "not_found", message: "missing" } }) } as never,
});

describe("teacher preview resolver", () => {
  it("prefers draft, then published, then local", async () => {
    const draft = await resolveTeacherPreviewLesson(id, sources(lesson("draft"), lesson("published"), lesson("local")));
    const published = await resolveTeacherPreviewLesson(id, sources(undefined, lesson("published"), lesson("local")));
    const local = await resolveTeacherPreviewLesson(id, sources(undefined, undefined, lesson("local")));
    expect(draft.status === "ready" && draft.source).toBe("draft");
    expect(published.status === "ready" && published.source).toBe("published");
    expect(local.status === "ready" && local.source).toBe("local");
  });

  it("returns not_found only when every source is unavailable", async () => {
    const result = await resolveTeacherPreviewLesson(id, sources());
    expect(result).toEqual({ status: "not_found" });
  });
});
