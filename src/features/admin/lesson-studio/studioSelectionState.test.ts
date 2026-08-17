import { describe, expect, it, vi } from "vitest";

import { canDiscardDirtyEditor, reconcileSelectedActivityId, shouldWarnBeforeUnload } from "./studioSelectionState";

const activities = [{ id: 10 }, { id: 20 }, { id: 30 }];

describe("Lesson Studio selection and dirty state", () => {
  it("preserves a stable selected ID across refetch and reorder", () => {
    expect(reconcileSelectedActivityId(20, activities)).toBe(20);
    expect(reconcileSelectedActivityId(20, [...activities].reverse())).toBe(20);
  });

  it("defaults only when no valid selection exists", () => {
    expect(reconcileSelectedActivityId(null, activities)).toBe(10);
    expect(reconcileSelectedActivityId(99, activities)).toBe(10);
    expect(reconcileSelectedActivityId(null, [])).toBeNull();
  });

  it("enables beforeunload only while dirty", () => {
    expect(shouldWarnBeforeUnload(true)).toBe(true);
    expect(shouldWarnBeforeUnload(false)).toBe(false);
  });

  it("requires confirmation only when dirty", () => {
    const confirm = vi.fn(() => true);
    expect(canDiscardDirtyEditor(false, confirm)).toBe(true);
    expect(confirm).not.toHaveBeenCalled();
    expect(canDiscardDirtyEditor(true, confirm)).toBe(true);
    expect(confirm).toHaveBeenCalledOnce();
  });
});
