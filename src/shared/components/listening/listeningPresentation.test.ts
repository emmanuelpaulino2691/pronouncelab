import { describe, expect, it } from "vitest";

import { hasListeningTranscript } from "./listeningPresentation";

describe("listening learner presentation", () => {
  it("shows legacy transcript content and suppresses empty transcript UI", () => {
    expect(hasListeningTranscript("Legacy listening transcript.")).toBe(true);
    expect(hasListeningTranscript("")).toBe(false);
    expect(hasListeningTranscript("   ")).toBe(false);
    expect(hasListeningTranscript(undefined)).toBe(false);
  });
});
