import { describe, expect, it, vi } from "vitest";
import { createLearnerProgressService } from "./learnerProgressService";

describe("learner progress identity gate", () => {
  it("does not load or mutate progress for a staff session", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: false, error: null });
    const service = createLearnerProgressService({ rpc });
    await expect(service.load()).resolves.toBeNull();
    await expect(service.visit("101")).resolves.toBe(false);
    await expect(service.completeActivity("201")).resolves.toBe(false);
    expect(rpc).toHaveBeenCalledTimes(3);
    expect(rpc).toHaveBeenCalledWith("is_learner_identity");
    expect(rpc.mock.calls.every(([name]) => name === "is_learner_identity")).toBe(true);
  });

  it("allows a learner session to reach progress RPCs", async () => {
    const rpc = vi.fn()
      .mockResolvedValueOnce({ data: true, error: null })
      .mockResolvedValueOnce({ data: null, error: null });
    await expect(createLearnerProgressService({ rpc }).completeActivity("201")).resolves.toBe(true);
    expect(rpc).toHaveBeenNthCalledWith(2, "record_learner_activity_completion", { requested_activity_id: "201" });
  });
});
