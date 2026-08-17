import { describe, expect, it } from "vitest";
import { canOfferActivityOperations, validCopyActivityInput, validDuplicateActivityPosition } from "./activityOperationState";

describe("activity operation workflows", () => {
  it.each(["theory", "listening", "pronunciation", "quiz", "practice", "ai_speaking_mission"] as const)("offers duplicate and copy for %s", (type) => expect(canOfferActivityOperations(type)).toBe(true));
  it("keeps incomplete Interactive Practice outside the workflow", () => expect(canOfferActivityOperations("interactive_practice")).toBe(false));
  it("validates duplicate positions", () => { expect(validDuplicateActivityPosition(2, 4)).toBe(true); expect(validDuplicateActivityPosition(0, 4)).toBe(false); });
  it("rejects the same lesson and permits an optional title", () => { expect(validCopyActivityInput({ sourceLessonId: 1, destinationLessonId: 1, title: "Copy" })).toBe(false); expect(validCopyActivityInput({ sourceLessonId: 1, destinationLessonId: 2, title: " " })).toBe(true); });
});
