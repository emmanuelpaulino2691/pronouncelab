import { describe, expect, it } from "vitest";
import {
  emptyInteractivePractice,
  validateInteractivePractice,
  type InteractivePracticeConfig,
} from "./interactivePractice";

describe("Interactive Practice validation", () => {
  it("allows an incomplete exercise to be represented as a draft", () => {
    expect(emptyInteractivePractice).toEqual({
      prompt: "",
      options: [],
      correctAnswer: null,
      pairs: [],
      acceptedAnswers: [],
    });
  });

  it("reports incomplete multiple-choice publication content", () => {
    expect(
      validateInteractivePractice(
        "multiple_choice",
        emptyInteractivePractice
      )
    ).toEqual([
      "Prompt is required.",
      "Add at least two options.",
      "Choose exactly one correct option.",
    ]);
  });

  it("requires one correct non-empty multiple-choice option", () => {
    const config: InteractivePracticeConfig = {
      ...emptyInteractivePractice,
      prompt: "Choose a word.",
      options: [
        { text: "cat", correct: true },
        { text: " ", correct: true },
      ],
    };

    expect(
      validateInteractivePractice(
        "multiple_choice",
        config
      )
    ).toContain("Add at least two options.");
  });

  it("accepts complete content for every exercise mode", () => {
    expect(
      validateInteractivePractice("multiple_choice", {
        ...emptyInteractivePractice,
        prompt: "Pick",
        options: [
          { text: "A", correct: true },
          { text: "B", correct: false },
        ],
      })
    ).toEqual([]);
    expect(
      validateInteractivePractice("true_false", {
        ...emptyInteractivePractice,
        prompt: "True?",
        correctAnswer: false,
      })
    ).toEqual([]);
    expect(
      validateInteractivePractice("match", {
        ...emptyInteractivePractice,
        prompt: "Match",
        pairs: [
          { left: "a", right: "1" },
          { left: "b", right: "2" },
        ],
      })
    ).toEqual([]);
    expect(
      validateInteractivePractice("fill_blank", {
        ...emptyInteractivePractice,
        prompt: "I ___",
        acceptedAnswers: ["am"],
      })
    ).toEqual([]);
  });

  it("rejects incomplete mode-specific publication content", () => {
    expect(
      validateInteractivePractice("true_false", {
        ...emptyInteractivePractice,
        prompt: "Statement",
      })
    ).toContain("Choose the correct answer.");
    expect(
      validateInteractivePractice("match", {
        ...emptyInteractivePractice,
        prompt: "Match",
        pairs: [{ left: "a", right: "1" }],
      })
    ).toContain("Add at least two complete pairs.");
    expect(
      validateInteractivePractice("fill_blank", {
        ...emptyInteractivePractice,
        prompt: "I ___",
        acceptedAnswers: [" "],
      })
    ).toContain("Add at least one accepted answer.");
  });

  it("serializes without changing the private scoring shape", () => {
    const value: InteractivePracticeConfig = {
      ...emptyInteractivePractice,
      prompt: "Pick",
      options: [{ text: "A", correct: true }],
    };

    expect(JSON.parse(JSON.stringify(value))).toEqual(
      value
    );
  });
});
