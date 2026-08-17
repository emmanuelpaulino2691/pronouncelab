import { describe, expect, it, vi } from "vitest";

import { shouldProceedWithClose } from "./closeGuard";

describe("shouldProceedWithClose", () => {
  it("allows closing when values are unchanged", () => {
    const confirmDiscard = vi.fn(() => false);

    expect(
      shouldProceedWithClose(
        { hasUnsavedChanges: false },
        confirmDiscard
      )
    ).toBe(true);
    expect(confirmDiscard).not.toHaveBeenCalled();
  });

  it("allows closing after successful submission", () => {
    const confirmDiscard = vi.fn(() => false);

    expect(
      shouldProceedWithClose(
        {
          hasUnsavedChanges: true,
          submissionSucceeded: true,
        },
        confirmDiscard
      )
    ).toBe(true);
    expect(confirmDiscard).not.toHaveBeenCalled();
  });

  it("uses confirmation for unsaved changes", () => {
    const confirmDiscard = vi.fn(() => true);

    expect(
      shouldProceedWithClose(
        { hasUnsavedChanges: true },
        confirmDiscard
      )
    ).toBe(true);
    expect(confirmDiscard).toHaveBeenCalledOnce();
  });

  it("keeps the interaction open when discard is declined", () => {
    const confirmDiscard = vi.fn(() => false);

    expect(
      shouldProceedWithClose(
        { hasUnsavedChanges: true },
        confirmDiscard
      )
    ).toBe(false);
  });
});
