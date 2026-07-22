import { describe, expect, it } from "vitest";

import {
  buildCourseUrlPreview,
  generateSlugFromTitle,
  normalizeSlug,
} from "./courseFormUtils";

describe("normalizeSlug", () => {
  it("normalizes words separated by spaces", () => {
    expect(normalizeSlug("English Pronunciation")).toBe(
      "english-pronunciation"
    );
  });

  it("removes diacritics", () => {
    expect(normalizeSlug("ÁÉÍÓÚ")).toBe("aeiou");
  });

  it("trims and collapses repeated whitespace", () => {
    expect(normalizeSlug("   Hello   World   ")).toBe(
      "hello-world"
    );
  });

  it("normalizes uppercase text", () => {
    expect(normalizeSlug("BEGINNER ENGLISH")).toBe(
      "beginner-english"
    );
  });

  it("replaces punctuation with separators", () => {
    expect(normalizeSlug("React & TypeScript")).toBe(
      "react-typescript"
    );
  });

  it("collapses repeated separators", () => {
    expect(normalizeSlug("English---for___Work")).toBe(
      "english-for-work"
    );
  });

  it("removes leading and trailing separators", () => {
    expect(normalizeSlug("---English Course---")).toBe(
      "english-course"
    );
  });

  it("returns an empty string for empty input", () => {
    expect(normalizeSlug("")).toBe("");
  });
});

describe("generateSlugFromTitle", () => {
  it("uses the same normalization contract as a manual slug", () => {
    expect(generateSlugFromTitle("Travel & Conversation")).toBe(
      "travel-conversation"
    );
  });
});

describe("buildCourseUrlPreview", () => {
  it("builds the learner course path from a slug", () => {
    expect(buildCourseUrlPreview("English Pronunciation")).toBe(
      "/courses/english-pronunciation"
    );
  });

  it("returns the learner course prefix for an empty slug", () => {
    expect(buildCourseUrlPreview("")).toBe("/courses/");
  });
});
