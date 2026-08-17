import { describe, expect, it } from "vitest";

import { acceptSavedEditorDraft, discardEditorDraft, initializeEditorDraft, reconcileEditorDraft, updateEditorDraft } from "./editorDraftState";

describe("Lesson Studio editor drafts", () => {
  it("does not replace a dirty same-activity draft when server object identity changes", () => {
    const dirty = updateEditorDraft(initializeEditorDraft(10, { title: "Server" }), { title: "Teacher draft" });
    expect(reconcileEditorDraft(dirty, 10, { title: "Refetched server" })).toBe(dirty);
  });

  it("initializes server state for a genuinely different activity", () => {
    const dirty = updateEditorDraft(initializeEditorDraft(10, "draft"), "changed");
    expect(reconcileEditorDraft(dirty, 20, "new activity")).toEqual({ activityId: 20, value: "new activity", dirty: false });
  });

  it("clears dirty state after save and explicit discard", () => {
    const dirty = updateEditorDraft(initializeEditorDraft(10, "server"), "draft");
    expect(acceptSavedEditorDraft(dirty, "saved")).toEqual({ activityId: 10, value: "saved", dirty: false });
    expect(discardEditorDraft(dirty, "server")).toEqual({ activityId: 10, value: "server", dirty: false });
  });
});
