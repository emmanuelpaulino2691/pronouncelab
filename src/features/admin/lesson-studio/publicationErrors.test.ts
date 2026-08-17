import { describe, expect, it } from "vitest";

import { publicationFunctionErrorMessage, publicationOperationErrorMessage } from "./publicationErrors";

describe("teacher publication errors", () => {
  it.each([
    ["Invalid publication media reference: listening audio", "Listening audio"],
    ["Invalid publication media reference: pronunciation audio", "Pronunciation audio"],
    ["Invalid publication media reference: theory media", "Learn media block"],
    ["Missing public Storage object for: listening audio", "missing from learner Storage"],
    ["Listening activities require audio before publication", "missing required audio"],
  ])("maps a known backend validation without exposing internals", (backend, expected) => {
    const message = publicationOperationErrorMessage({ code: "P0001", message: backend, details: "public.media_assets" });
    expect(message).toContain(expected);
    expect(message).not.toContain("media_assets");
  });

  it("keeps unexpected backend errors sanitized", () => {
    expect(publicationOperationErrorMessage({ message: "duplicate key in public.lesson_versions" }))
      .toBe("The action could not be completed. Your content is unchanged. Try again.");
  });

  it("uses the trusted publication function's actionable response", async () => {
    const message = await publicationFunctionErrorMessage({
      context: { json: async () => ({ message: "Listening audio in listening item 42 is missing from Storage. Re-upload it and try again." }) },
    });
    expect(message).toContain("listening item 42");
    expect(message).toContain("Re-upload");
  });

  it("sanitizes an unreadable function response", async () => {
    expect(await publicationFunctionErrorMessage({ context: { json: async () => { throw new Error("secret"); } } }))
      .toBe("The action could not be completed. Your content is unchanged. Try again.");
  });
});
