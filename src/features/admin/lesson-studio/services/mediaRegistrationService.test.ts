import { describe, expect, it } from "vitest";
import type { RegisteredMedia } from "./mediaRegistrationService";

describe("trusted media registration contract", () => {
  it("represents both new and reused stable media identities", () => {
    const created: RegisteredMedia = { id: "asset-1", status: "draft", reused: false };
    const reused: RegisteredMedia = { id: "asset-1", status: "published", reused: true };
    expect(created).toEqual({ id: "asset-1", status: "draft", reused: false });
    expect(reused).toEqual({ id: "asset-1", status: "published", reused: true });
  });
});
