import { describe, expect, it, vi } from "vitest";
import { resolveLearnerRouteIdentity } from "./learnerRouteIdentity";

describe("learner-route identity", () => {
  it("keeps anonymous visitors in guest mode without an RPC", async () => {
    const client = { rpc: vi.fn() };
    await expect(resolveLearnerRouteIdentity(null, client)).resolves.toEqual({ kind: "anonymous", session: null });
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it.each([[true, "learner"], [false, "staff"]] as const)("maps is_learner_identity=%s to %s", async (allowed, kind) => {
    const session = { user: { email: `${kind}@example.com` } } as never;
    const client = { rpc: vi.fn().mockResolvedValue({ data: allowed, error: null }) };
    await expect(resolveLearnerRouteIdentity(session, client)).resolves.toEqual({ kind, session });
  });
});
