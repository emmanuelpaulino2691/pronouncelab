import { describe, expect, it } from "vitest";

import {
  beginDeleteConfirmation,
  cancelDeleteConfirmation,
  completeDeleteConfirmation,
  failDeleteConfirmation,
  openDeleteConfirmation,
} from "./deleteConfirmationState";

describe("delete confirmation state", () => {
  it("preserves the current entity through confirmation", () => {
    const opened = openDeleteConfirmation({ id: 42, title: "Current" });
    const pending = beginDeleteConfirmation(opened);

    expect(pending).toEqual({
      target: { id: 42, title: "Current" },
      pending: true,
    });
  });

  it("cancels without beginning deletion", () => {
    expect(cancelDeleteConfirmation(openDeleteConfirmation({ id: 1 }))).toEqual({
      target: null,
      pending: false,
    });
  });

  it("does not cancel an active deletion", () => {
    const pending = beginDeleteConfirmation(openDeleteConfirmation({ id: 1 }));

    expect(cancelDeleteConfirmation(pending)).toBe(pending);
  });

  it("clears the target after successful deletion", () => {
    expect(completeDeleteConfirmation()).toEqual({
      target: null,
      pending: false,
    });
  });

  it("keeps the entity and permits retry after failure", () => {
    const failed = failDeleteConfirmation(
      beginDeleteConfirmation(openDeleteConfirmation({ id: 7 }))
    );

    expect(failed).toEqual({ target: { id: 7 }, pending: false });
    expect(beginDeleteConfirmation(failed).pending).toBe(true);
  });
});
