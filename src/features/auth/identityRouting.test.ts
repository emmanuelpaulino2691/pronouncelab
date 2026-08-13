import { describe, expect, it, vi } from "vitest";
import { authenticatedDestination, resolveAuthenticatedIdentity } from "./identityRouting";

describe("role-aware authentication routing", () => {
  it("routes learners to learner Home and never into a requested admin path", () => {
    expect(authenticatedDestination("learner")).toBe("/");
    expect(authenticatedDestination("learner", "/courses/52")).toBe("/courses/52");
    expect(authenticatedDestination("learner", "/admin/courses")).toBe("/");
  });

  it("routes staff to Content Studio and preserves an intended admin path", () => {
    expect(authenticatedDestination("staff")).toBe("/admin");
    expect(authenticatedDestination("staff", "/admin/courses")).toBe("/admin/courses");
    expect(authenticatedDestination("staff", "/courses/52")).toBe("/admin");
  });

  it.each([
    ["Admin", true, true, "staff"],
    ["Teacher", true, false, "staff"],
    ["Learner", false, false, "learner"],
  ] as const)("resolves %s capabilities as %s", async (_label, canManage, isAdmin, kind) => {
    const client = {
      rpc: vi.fn((name: "can_manage_content" | "is_platform_admin") => Promise.resolve({
        data: name === "can_manage_content" ? canManage : isAdmin,
        error: null,
      })),
    };
    await expect(resolveAuthenticatedIdentity({ user: { id: "user" } } as never, client)).resolves.toMatchObject({ kind });
    expect(client.rpc).toHaveBeenCalledWith("can_manage_content");
    expect(client.rpc).toHaveBeenCalledWith("is_platform_admin");
  });

  it("fails closed when capability resolution is unavailable", async () => {
    await expect(resolveAuthenticatedIdentity({} as never, { rpc: vi.fn().mockResolvedValue({ data: null, error: {} }) })).rejects.toThrow("Unable to verify account access.");
  });
});
