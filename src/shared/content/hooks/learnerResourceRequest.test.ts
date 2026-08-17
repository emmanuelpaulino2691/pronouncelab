import { describe, expect, it, vi } from "vitest";
import { contentSuccess } from "../errors/contentErrors";
import { isCurrentResourceRequest, settleLearnerResourceLoad } from "./learnerResourceRequest";

describe("learner resource requests", () => {
  it("settles successful preview loads", async () => {
    const result = await settleLearnerResourceLoad(async () => contentSuccess("ready", "1"), new AbortController().signal);
    expect(result).toMatchObject({ ok: true, value: "ready" });
  });

  it("turns unexpected exceptions into a terminal retryable error", async () => {
    const result = await settleLearnerResourceLoad(async () => { throw new Error("database detail"); }, new AbortController().signal);
    expect(result).toMatchObject({ ok: false, error: { code: "unexpected", retryable: true } });
    expect(result.ok || result.error.message).not.toContain("database detail");
  });

  it("prevents stale requests from replacing newer results", () => {
    expect(isCurrentResourceRequest(1, 2, new AbortController().signal)).toBe(false);
    expect(isCurrentResourceRequest(2, 2, new AbortController().signal)).toBe(true);
  });

  it("allows a Strict Mode replacement request after cleanup aborts the first", () => {
    const first = new AbortController();
    first.abort();
    const second = new AbortController();
    expect(isCurrentResourceRequest(1, 2, first.signal)).toBe(false);
    expect(isCurrentResourceRequest(2, 2, second.signal)).toBe(true);
  });

  it("executes exactly once per explicit retry request", async () => {
    const load = vi.fn(async () => contentSuccess("ready", "1"));
    await settleLearnerResourceLoad(load, new AbortController().signal);
    await settleLearnerResourceLoad(load, new AbortController().signal);
    expect(load).toHaveBeenCalledTimes(2);
  });
});
