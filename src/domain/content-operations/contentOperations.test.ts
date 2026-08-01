import { describe, expect, it } from "vitest";
import { dragId, getPublicationIndicator, moveId, pendingBackendOperation } from ".";
import type { CopyLessonRequest, DuplicateUnitRequest, MoveLessonRequest } from ".";

describe("content operations foundation", () => {
  it("keeps reorder helpers stable and boundary-safe", () => {
    expect(moveId([1, 2, 3], 2, -1)).toEqual([2, 1, 3]);
    expect(moveId([1, 2, 3], 1, -1)).toEqual([1, 2, 3]);
    expect(dragId([1, 2, 3], 1, 3)).toEqual([2, 3, 1]);
  });
  it("describes publication states without inventing them", () => {
    expect(getPublicationIndicator({ status: "published" }).label).toBe("Published");
    expect(getPublicationIndicator({ status: "draft" }).label).toBe("Draft");
    expect(getPublicationIndicator({ status: "draft", currentPublishedVersionId: 4 }).label).toBe("Draft changes");
    expect(getPublicationIndicator({ status: "archived" }).label).toBe("Archived");
    expect(getPublicationIndicator({ status: "unknown" }).label).toBe("Unavailable");
  });
  it("models destination requests without simulated success", () => {
    const duplicate: DuplicateUnitRequest = { courseId: 1, unitId: 2, title: "Copy" };
    const copy: CopyLessonRequest = { courseId: 1, lessonId: 3, sourceUnitId: 2, destinationUnitId: 4, title: "Lesson copy" };
    const move: MoveLessonRequest = { courseId: 1, lessonId: 3, sourceUnitId: 2, destinationUnitId: 4, position: 1 };
    expect([duplicate.title, copy.destinationUnitId, move.position]).toEqual(["Copy", 4, 1]);
    expect(pendingBackendOperation.available).toBe(false);
  });
});
