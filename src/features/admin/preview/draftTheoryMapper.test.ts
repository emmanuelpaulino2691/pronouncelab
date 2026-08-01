import { describe, expect, it, vi } from "vitest";

vi.mock("../lesson-studio/services/learnMediaService", () => ({
  getLearnMediaAsset: vi.fn(async (id: string, kind: "image" | "audio") => ({ id, filename: `${kind}.bin`, mimeType: `${kind}/test`, previewUrl: `https://signed.example/${kind}` })),
}));
vi.mock("../lesson-studio/services/activityContentService", () => ({
  listTheoryBlocks: vi.fn(), listListeningItems: vi.fn(), listPronunciationItems: vi.fn(), getAssessment: vi.fn(), listQuestions: vi.fn(),
}));
vi.mock("../lesson-studio/services/lessonStudioService", () => ({ listActivities: vi.fn(), loadLessonVersion: vi.fn() }));
vi.mock("../lesson-studio/services/aiMissionService", () => ({ getAiMission: vi.fn() }));

import { listTheoryBlocks } from "../lesson-studio/services/activityContentService";
import { mapDraftLessonToLearnerLessonData } from "./teacherPreviewSources";

describe("draft theory preview mapping", () => {
  it("renders saved image and audio references through secure runtime URLs", async () => {
    vi.mocked(listTheoryBlocks).mockResolvedValue([
      { id: 1, activityId: 9, blockType: "image", position: 0, headingLevel: null, title: null, text: "", mediaAssetId: "image-asset", altText: "Diagram", updatedAt: "" },
      { id: 2, activityId: 9, blockType: "audio", position: 1, headingLevel: null, title: "Listen and repeat", text: "Ship. Sheep.", mediaAssetId: "audio-asset", altText: null, updatedAt: "" },
    ]);
    const lesson = await mapDraftLessonToLearnerLessonData({ id: 3, unitId: 2, title: "Lesson", description: "" }, 1, [{ id: 9, lessonVersionId: 4, type: "theory", title: "Learn", position: 0, required: true, updatedAt: "" }]);
    const activity = lesson.activities[0];
    expect(activity.type === "theory" && activity.blocks).toEqual([
      expect.objectContaining({ type: "image", media: expect.objectContaining({ id: "image-asset", url: "https://signed.example/image" }) }),
      expect.objectContaining({ type: "audio", label: "Listen and repeat", transcript: "Ship. Sheep.", media: expect.objectContaining({ id: "audio-asset", url: "https://signed.example/audio" }) }),
    ]);
  });

  it("keeps the saved media reference and lesson when a signed URL fails", async () => {
    const { getLearnMediaAsset } = await import("../lesson-studio/services/learnMediaService");
    vi.mocked(getLearnMediaAsset).mockRejectedValueOnce(new Error("signed URL failed"));
    vi.mocked(listTheoryBlocks).mockResolvedValue([{ id: 2, activityId: 9, blockType: "audio", position: 0, headingLevel: null, title: "Audio label", text: "Transcript", mediaAssetId: "audio-asset", altText: null, updatedAt: "" }]);
    const lesson = await mapDraftLessonToLearnerLessonData({ id: 3, unitId: 2, title: "Lesson", description: "" }, 1, [{ id: 9, lessonVersionId: 4, type: "theory", title: "Learn", position: 0, required: true, updatedAt: "" }]);
    expect(lesson.activities[0]).toMatchObject({ type: "theory", blocks: [{ type: "audio", label: "Audio label", transcript: "Transcript", media: { id: "audio-asset", url: "" } }] });
  });
});
