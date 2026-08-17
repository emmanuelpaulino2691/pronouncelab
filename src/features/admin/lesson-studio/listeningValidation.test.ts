import { describe, expect, it } from "vitest";

import {
  applyListeningAudioAsset,
  getListeningAudioFileError,
  getListeningTranscriptError,
  maxListeningAudioBytes,
  normalizeListeningTranscript,
} from "./listeningValidation";

describe("listening authoring validation", () => {
  it("accepts an MP3 and rejects unsupported or oversized files", () => {
    expect(getListeningAudioFileError({ name: "lesson.mp3", type: "audio/mpeg", size: 100 })).toBe("");
    expect(getListeningAudioFileError({ name: "lesson.wav", type: "audio/wav", size: 100 })).not.toBe("");
    expect(getListeningAudioFileError({ name: "lesson.mp3", type: "audio/mpeg", size: maxListeningAudioBytes + 1 })).not.toBe("");
  });

  it("supports manual, empty, and bounded transcripts", () => {
    expect(normalizeListeningTranscript("  Complete transcript.  ")).toBe("Complete transcript.");
    expect(normalizeListeningTranscript("   ")).toBeNull();
    expect(getListeningTranscriptError("x".repeat(20_001))).not.toBe("");
  });

  it("allows removing and replacing an attached audio identifier", () => {
    const attached = { activityId: 17, title: "Keep me", audioAssetId: "audio-one" as string | null };
    const replaced = applyListeningAudioAsset(attached, "audio-two");
    const removed = applyListeningAudioAsset(replaced, null);
    expect(replaced.audioAssetId).toBe("audio-two");
    expect(replaced.activityId).toBe(17);
    expect(replaced.title).toBe("Keep me");
    expect(removed.audioAssetId).toBeNull();
  });
});
