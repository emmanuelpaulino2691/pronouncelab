import { describe, expect, it } from "vitest";

import {
  adminSidebarAccountClassName,
  adminSidebarClassName,
  adminSidebarHeaderClassName,
  adminSidebarNavigationClassName,
} from "./adminSidebarLayout";

describe("admin sidebar layout", () => {
  it("uses the dynamic viewport without allowing sidebar overflow", () => {
    expect(adminSidebarClassName).toContain("h-[100dvh]");
    expect(adminSidebarClassName).toContain("max-h-[100dvh]");
    expect(adminSidebarClassName).toContain("overflow-hidden");
  });

  it("scrolls navigation while keeping branding and account actions visible", () => {
    expect(adminSidebarHeaderClassName).toContain("shrink-0");
    expect(adminSidebarNavigationClassName).toContain("min-h-0");
    expect(adminSidebarNavigationClassName).toContain("flex-1");
    expect(adminSidebarNavigationClassName).toContain("overflow-y-auto");
    expect(adminSidebarAccountClassName).toContain("shrink-0");
  });
});
