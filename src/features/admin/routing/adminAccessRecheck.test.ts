import { describe, expect, it } from "vitest";

import { shouldPreserveAdminContent } from "./adminAccessRecheck";

describe("admin access background rechecks", () => {
  it("keeps Lesson Studio mounted after file-picker focus returns", () => {
    expect(shouldPreserveAdminContent("window-focus")).toBe(true);
  });

  it("keeps current activity state mounted during token refresh", () => {
    expect(shouldPreserveAdminContent("token-refresh")).toBe(true);
  });

  it("keeps the Studio mounted for a repeated same-user signed-in event", () => {
    expect(shouldPreserveAdminContent("signed-in", true)).toBe(true);
  });

  it("uses a blocking check when the authenticated identity changes", () => {
    expect(shouldPreserveAdminContent("signed-in", false)).toBe(false);
  });

  it("uses the blocking state for the initial authorization check", () => {
    expect(shouldPreserveAdminContent("initial")).toBe(false);
  });
});
