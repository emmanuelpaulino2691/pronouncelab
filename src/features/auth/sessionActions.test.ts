import { describe, expect, it, vi } from "vitest";
import { signOutAccount } from "./sessionActions";

describe("account sign-out", () => {
  it("uses only the authentication client and leaves learner storage outside its scope", async () => {
    const auth = { signOut: vi.fn().mockResolvedValue({ error: null }) };
    const localProgress = { completedLessonIds: [101] };
    await expect(signOutAccount(auth)).resolves.toBeUndefined();
    expect(auth.signOut).toHaveBeenCalledOnce();
    expect(localProgress).toEqual({ completedLessonIds: [101] });
  });

  it("does not claim success when authentication sign-out fails", async () => {
    await expect(signOutAccount({ signOut: vi.fn().mockResolvedValue({ error: {} }) })).rejects.toThrow("Unable to sign out.");
  });
});
