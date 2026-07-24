import { describe, expect, it } from "vitest";
import { futureWorkspaceSections, getWorkspaceHeading, getWorkspaceRole } from "./workspace";

describe("teacher workspace", () => {
  it("distinguishes the supported roles from permission capabilities", () => {
    expect(getWorkspaceRole({ canEditDrafts: true, canPublish: true, isAdmin: false })).toBe("teacher");
    expect(getWorkspaceRole({ canEditDrafts: false, canPublish: true, isAdmin: false })).toBe("publisher");
    expect(getWorkspaceRole({ canEditDrafts: true, canPublish: false, isAdmin: false })).toBe("editor");
    expect(getWorkspaceRole({ canEditDrafts: true, canPublish: true, isAdmin: true })).toBe("administrator");
  });

  it("keeps future sections visibly planned rather than functional", () => {
    expect(getWorkspaceHeading("teacher")).toBe("Teacher Dashboard");
    expect(getWorkspaceHeading("administrator")).toBe("Platform overview");
    expect(futureWorkspaceSections).toEqual(["Classes", "Students", "Assignments"]);
  });
});
