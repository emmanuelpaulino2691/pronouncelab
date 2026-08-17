import { describe, expect, it } from "vitest";

import {
  canChooseLessonCreationOption,
  canStartLessonCreation,
  chooseBlankLesson,
  getInitialLessonCreationStage,
  returnToLessonChoice,
} from "./lessonCreationState";

describe("lesson creation state", () => {
  it("opens in the choice stage", () => {
    expect(getInitialLessonCreationStage()).toBe("choice");
  });

  it("moves to the blank form", () => {
    expect(chooseBlankLesson()).toBe("blank-form");
  });

  it("returns safely to the choice stage", () => {
    expect(returnToLessonChoice()).toBe("choice");
  });

  it("keeps the future template option unavailable", () => {
    expect(canChooseLessonCreationOption("template")).toBe(false);
    expect(canChooseLessonCreationOption("blank")).toBe(true);
  });

  it("prevents creation while a submission is active", () => {
    expect(canStartLessonCreation(true, false)).toBe(false);
  });

  it("prevents another write or navigation after creation", () => {
    expect(canStartLessonCreation(false, true)).toBe(false);
    expect(canStartLessonCreation(false, false)).toBe(true);
  });
});
