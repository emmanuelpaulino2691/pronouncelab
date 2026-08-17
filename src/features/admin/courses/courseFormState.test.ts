import { describe, expect, it } from "vitest";

import type { CourseInput } from "./adminCourseService";
import { buildCourseUrlPreview } from "./courseFormUtils";
import {
  areCourseInputsEqual,
  buildCourseSubmissionInput,
  canSubmitCourseForm,
  createCourseSlugState,
  enableManualSlugEditing,
  getCourseSlugError,
  resetSlugToTitle,
  setManualSlug,
  shouldRenderCourseForm,
  updateSlugForTitle,
} from "./courseFormState";

describe("course form slug state", () => {
  it("starts a new course in automatic mode", () => {
    const initial = createCourseSlugState("", false);

    expect(initial).toEqual({ slug: "", ownership: "automatic" });
  });

  it("generates and updates a new course slug from its title", () => {
    const initial = createCourseSlugState("", false);
    const firstUpdate = updateSlugForTitle(initial, "English Pronunciation");

    expect(firstUpdate).toEqual({
      slug: "english-pronunciation",
      ownership: "automatic",
    });
    expect(updateSlugForTitle(firstUpdate, "Clear English").slug).toBe(
      "clear-english"
    );
  });

  it("switches ownership when manual editing is enabled", () => {
    expect(
      enableManualSlugEditing({ slug: "generated-address", ownership: "automatic" })
    ).toEqual({ slug: "generated-address", ownership: "manual" });
  });

  it("stops title syncing after a manual slug edit", () => {
    const manual = setManualSlug("custom-address");

    expect(manual.ownership).toBe("manual");
    expect(updateSlugForTitle(manual, "A Different Title")).toEqual(manual);
  });

  it("resets the slug and restores title syncing", () => {
    const reset = resetSlugToTitle("Speaking with Confidence");

    expect(reset).toEqual({
      slug: "speaking-with-confidence",
      ownership: "automatic",
    });
    expect(updateSlugForTitle(reset, "Everyday Speaking").slug).toBe(
      "everyday-speaking"
    );
    expect(buildCourseUrlPreview(reset.slug)).toBe(
      "/courses/speaking-with-confidence"
    );
  });

  it("preserves an existing course slug when its title changes", () => {
    const existing = createCourseSlugState("original-address", true);

    expect(existing.ownership).toBe("manual");
    expect(updateSlugForTitle(existing, "Renamed Course")).toEqual(existing);
  });
});

describe("course form validation", () => {
  it("preserves the URL-safe slug rules", () => {
    expect(getCourseSlugError("safe-course-2")).toBe("");
    expect(getCourseSlugError("")).toBe("Add a course address.");
    expect(getCourseSlugError("Unsafe Address")).toBe(
      "Use lowercase letters, numbers, and single hyphens only."
    );
    expect(getCourseSlugError("repeated--separator")).not.toBe("");
  });

  it("prevents submission while a save is already in progress", () => {
    expect(canSubmitCourseForm(true, "", "")).toBe(false);
    expect(canSubmitCourseForm(false, "", "")).toBe(true);
  });

  it("includes the automatic slug in the create payload", () => {
    const slugState = updateSlugForTitle(
      createCourseSlugState("", false),
      "Short and Long A Sounds"
    );
    const payload = buildCourseSubmissionInput({
      title: "Short and Long A Sounds",
      slug: slugState.slug,
      description: "",
      level: "",
      emoji: "📘",
      position: 3,
    });
    expect(payload.slug).toBe("short-and-long-a-sounds");
    expect(canSubmitCourseForm(false, "", getCourseSlugError(payload.slug))).toBe(true);
  });

  it("waits for course positions before mounting a create form", () => {
    expect(shouldRenderCourseForm(true, true)).toBe(false);
    expect(shouldRenderCourseForm(true, false)).toBe(true);
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
