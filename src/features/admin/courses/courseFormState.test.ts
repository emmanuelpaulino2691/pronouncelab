import { describe, expect, it } from "vitest";

import type { CourseInput } from "./adminCourseService";
import {
  areCourseInputsEqual,
  createCourseSlugState,
  resetSlugToTitle,
  setManualSlug,
  updateSlugForTitle,
} from "./courseFormState";

describe("course form slug state", () => {
  it("syncs a new course slug with its title", () => {
    const initial = createCourseSlugState("", false);

    expect(updateSlugForTitle(initial, "English Pronunciation")).toEqual({
      slug: "english-pronunciation",
      syncWithTitle: true,
    });
  });

  it("stops title syncing after a manual slug edit", () => {
    const manual = setManualSlug("custom-address");

    expect(updateSlugForTitle(manual, "A Different Title")).toEqual(manual);
  });

  it("resets the slug and restores title syncing", () => {
    const reset = resetSlugToTitle("Speaking with Confidence");

    expect(reset).toEqual({
      slug: "speaking-with-confidence",
      syncWithTitle: true,
    });
    expect(updateSlugForTitle(reset, "Everyday Speaking").slug).toBe(
      "everyday-speaking"
    );
  });

  it("preserves an existing course slug when its title changes", () => {
    const existing = createCourseSlugState("original-address", true);

    expect(updateSlugForTitle(existing, "Renamed Course")).toEqual(existing);
  });
});

describe("course form dirty state", () => {
  const input: CourseInput = {
    title: "Pronunciation",
    slug: "pronunciation",
    description: "Build clear speech.",
    level: "Beginner",
    emoji: "🎙️",
    position: 2,
  };

  it("treats identical course values as unchanged", () => {
    expect(areCourseInputsEqual(input, { ...input })).toBe(true);
  });

  it("detects a changed course value", () => {
    expect(areCourseInputsEqual(input, { ...input, level: "Intermediate" })).toBe(false);
  });
});
