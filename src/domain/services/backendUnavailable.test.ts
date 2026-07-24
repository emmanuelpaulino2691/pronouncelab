import { describe, expect, it } from "vitest";
import { BackendUnavailableClassService } from "./backendUnavailable";
import { BackendUnavailableError } from "../shared/errors";

describe("backend-unavailable adapters", () => {
  it("fail explicitly instead of simulating classroom success", async () => {
    await expect(new BackendUnavailableClassService().list()).rejects.toBeInstanceOf(BackendUnavailableError);
  });
});
