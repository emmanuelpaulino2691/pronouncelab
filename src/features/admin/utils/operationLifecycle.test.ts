import { describe, expect, it } from "vitest";

import {
  beginOperation,
  completeOperation,
  createIdleOperation,
  failOperation,
} from "./operationLifecycle";

describe("operation lifecycle", () => {
  it("clears pending after successful creation and prevents a second submission", () => {
    const pending = beginOperation(
      createIdleOperation<{ title: string; id?: number }>({ title: "New unit" })
    );
    const completed = completeOperation(pending, { title: "New unit", id: 42 });

    expect(completed).toMatchObject({ pending: false, completed: true });
    expect(beginOperation(completed)).toBe(completed);
  });

  it("clears pending after failed creation while retaining form data for retry", () => {
    const initial = createIdleOperation({ title: "Unsaved lesson" });
    const failed = failOperation(beginOperation(initial), "Save failed");

    expect(failed).toEqual({
      pending: false,
      completed: false,
      value: initial.value,
      error: "Save failed",
    });
    expect(beginOperation(failed).pending).toBe(true);
  });

  it("clears pending after successful deletion", () => {
    const completed = completeOperation(
      beginOperation(createIdleOperation([1, 2, 3])),
      [1, 3]
    );

    expect(completed).toMatchObject({ pending: false, completed: true, value: [1, 3] });
  });

  it("clears pending after failed deletion and allows retry", () => {
    const failed = failOperation(
      beginOperation(createIdleOperation([1, 2, 3])),
      "Delete failed"
    );

    expect(failed.pending).toBe(false);
    expect(beginOperation(failed).pending).toBe(true);
  });

  it("completes duplication only once", () => {
    const pending = beginOperation(createIdleOperation([1]));
    const completed = completeOperation(pending, [1, 2]);

    expect(completeOperation(completed, [1, 2, 3])).toBe(completed);
    expect(completed.value).toEqual([1, 2]);
  });
});
