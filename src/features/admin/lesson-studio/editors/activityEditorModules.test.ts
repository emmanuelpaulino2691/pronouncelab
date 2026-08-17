import { describe, expect, it } from "vitest";
import { activityEditorLoaders } from "./activityEditorModules";
import { editorChunkFailureTitle, editorLoadingLabel } from "../components/lazyEditorUi";

describe("activity-specific editor loading", () => {
  it("defines one stable lazy loader for every Studio activity editor", () => {
    expect(Object.keys(activityEditorLoaders)).toEqual(["theory", "listening", "pronunciation", "practice", "quiz", "interactive_practice", "ai_speaking_mission"]);
    expect(activityEditorLoaders.theory).toBe(activityEditorLoaders.theory);
  });
  it("keeps editor loaders activity-specific", () => expect(new Set(Object.values(activityEditorLoaders)).size).toBe(7));
  it("provides stable loading and controlled failure copy", () => {
    expect(editorLoadingLabel).toBe("Loading activity editor");
    expect(editorChunkFailureTitle).not.toMatch(/chunk|import|module/i);
  });
});
