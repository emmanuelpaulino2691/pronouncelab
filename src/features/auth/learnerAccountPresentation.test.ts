import { describe, expect, it } from "vitest";
import { learnerAccountPresentation, learnerSignOutDestination } from "./learnerAccountPresentation";

describe("learner account presentation", () => {
  it("distinguishes guest device-local progress from a synced account", () => {
    expect(learnerAccountPresentation({ kind: "anonymous", session: null })).toEqual({
      kind: "guest",
      label: "Guest mode",
      detail: "Progress is saved on this device",
    });
    expect(learnerAccountPresentation({ kind: "learner", session: { user: { email: "learner@example.com" } } as never })).toEqual({
      kind: "synced",
      label: "Progress synced",
      detail: "learner@example.com",
    });
  });

  it("labels staff on learner routes as previewing rather than synced", () => {
    expect(learnerAccountPresentation({ kind: "staff", session: { user: { email: "teacher@example.com" } } as never })).toEqual({
      kind: "staff",
      label: "Staff preview",
      detail: "teacher@example.com",
    });
  });

  it("keeps learner sign-out in the anonymous learner experience", () => {
    expect(learnerSignOutDestination).toBe("/");
  });
});
