import { describe, expect, it, vi } from "vitest";
import { verifyStoredSession } from "./staleSession";

const session = { access_token: "stale-token" } as never;

describe("stale Supabase session recovery", () => {
  it("preserves a session whose user still exists", async () => {
    const signOut = vi.fn();
    const auth = { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user" } }, error: null }), signOut } as never;
    await expect(verifyStoredSession(auth, session)).resolves.toBe(session);
    expect(signOut).not.toHaveBeenCalled();
  });

  it("clears only local auth state when the stored user is invalid", async () => {
    const signOut = vi.fn().mockResolvedValue({ error: null });
    const auth = { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error("User not found") }), signOut } as never;
    await expect(verifyStoredSession(auth, session)).resolves.toBeNull();
    expect(signOut).toHaveBeenCalledOnce();
    expect(signOut).toHaveBeenCalledWith({ scope: "local" });
  });
});
