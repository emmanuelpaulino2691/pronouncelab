import { describe, expect, it, vi } from "vitest";
import { resolveExplicitTeacherPreview, resolveTeacherPreviewLesson } from "./teacherPreviewResolver";
import type { LearnerLesson } from "../../../shared/content/contracts/learnerContent";
import type { LearnerContentProvider } from "../../../shared/content/providers/LearnerContentProvider";

const lesson = (title: string) => ({ id: "1", unitId: "2", courseId: "3", title, description: "", metadata: { source: "local", fixtureRevision: "1" }, activities: [] } as unknown as LearnerLesson);
const id = "1" as never;
const sources = (draft?: LearnerLesson, published?: LearnerLesson, local?: LearnerLesson) => {
  const publishedGetLesson = vi.fn(async () => published ? { ok: true as const, value: published } : { ok: false as const, error: { code: "not_found", message: "missing" } });
  const localGetLesson = vi.fn(async () => local ? { ok: true as const, value: local } : { ok: false as const, error: { code: "not_found", message: "missing" } });
  return {
    draft: { getLesson: vi.fn(async () => draft ?? null) },
    published: { getLesson: publishedGetLesson } as unknown as LearnerContentProvider,
    local: { getLesson: localGetLesson } as unknown as LearnerContentProvider,
    publishedGetLesson,
    localGetLesson,
  };
};

describe("teacher preview resolver", () => {
  it("prefers draft, then published, then local", async () => {
    const draft = await resolveTeacherPreviewLesson(id, sources(lesson("draft"), lesson("published"), lesson("local")));
    const published = await resolveTeacherPreviewLesson(id, sources(undefined, lesson("published"), lesson("local")));
    const local = await resolveTeacherPreviewLesson(id, sources(undefined, undefined, lesson("local")));
    expect(draft.status === "ready" && draft.source).toBe("draft");
    expect(published.status === "ready" && published.source).toBe("published");
    expect(local.status === "ready" && local.source).toBe("local");
  });

  it("returns unavailable when every source is unavailable", async () => {
    const result = await resolveTeacherPreviewLesson(id, sources());
    expect(result).toMatchObject({ status: "unavailable" });
  });

  it("falls back when draft throws and when published is missing", async () => {
    const value = lesson("local");
    const input = sources(undefined, undefined, value);
    input.draft.getLesson.mockRejectedValueOnce(new Error("missing optional RPC"));
    const result = await resolveTeacherPreviewLesson(id, input);
    expect(result).toMatchObject({ status: "ready", source: "local" });
    expect(input.draft.getLesson).toHaveBeenCalledTimes(1);
  });

  it("returns forbidden without falling through to local content", async () => {
    const input = sources(undefined, undefined, lesson("local"));
    input.publishedGetLesson.mockResolvedValueOnce({ ok: false, error: { code: "forbidden", message: "no" } } as never);
    const result = await resolveTeacherPreviewLesson(id, input);
    expect(result).toEqual({ status: "forbidden" });
    expect(input.localGetLesson).not.toHaveBeenCalled();
  });

  it("returns error after unexpected source failures", async () => {
    const input = sources();
    input.draft.getLesson.mockRejectedValueOnce(new Error("draft"));
    input.publishedGetLesson.mockRejectedValueOnce(new Error("published"));
    input.localGetLesson.mockRejectedValueOnce(new Error("local"));
    await expect(resolveTeacherPreviewLesson(id, input)).resolves.toMatchObject({ status: "error" });
  });

  it("never substitutes Draft when Published Preview was selected", async () => {
    const draftLoader = vi.fn(async () => lesson("draft"));
    const result = await resolveExplicitTeacherPreview("published", draftLoader, async () => null);
    expect(result).toMatchObject({ status: "unavailable" });
    expect(draftLoader).not.toHaveBeenCalled();
  });

  it("never substitutes Published when Draft Preview was selected", async () => {
    const publishedLoader = vi.fn(async () => lesson("published"));
    const result = await resolveExplicitTeacherPreview("draft", async () => null, publishedLoader);
    expect(result).toMatchObject({ status: "unavailable" });
    expect(publishedLoader).not.toHaveBeenCalled();
  });
});
