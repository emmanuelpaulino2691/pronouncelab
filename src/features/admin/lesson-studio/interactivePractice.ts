export const interactivePracticeModes = [
  "multiple_choice",
  "true_false",
  "match",
  "fill_blank",
] as const;

export type InteractivePracticeMode =
  (typeof interactivePracticeModes)[number];

export type InteractivePracticeConfig = {
  prompt: string;
  options: { text: string; correct: boolean }[];
  correctAnswer: boolean | null;
  pairs: { left: string; right: string }[];
  acceptedAnswers: string[];
};

export const emptyInteractivePractice: InteractivePracticeConfig = {
  prompt: "",
  options: [],
  correctAnswer: null,
  pairs: [],
  acceptedAnswers: [],
};

export function validateInteractivePractice(
  mode: InteractivePracticeMode,
  value: InteractivePracticeConfig
) {
  const errors: string[] = [];

  if (!value.prompt.trim()) {
    errors.push(
      mode === "true_false"
        ? "Statement is required."
        : "Prompt is required."
    );
  }

  if (mode === "multiple_choice") {
    const completeOptions = value.options.filter(
      (item) => item.text.trim()
    );
    if (completeOptions.length < 2) {
      errors.push("Add at least two options.");
    }
    if (
      completeOptions.filter((item) => item.correct)
        .length !== 1
    ) {
      errors.push("Choose exactly one correct option.");
    }
  }

  if (
    mode === "true_false" &&
    value.correctAnswer === null
  ) {
    errors.push("Choose the correct answer.");
  }

  if (
    mode === "match" &&
    value.pairs.filter(
      (pair) => pair.left.trim() && pair.right.trim()
    ).length < 2
  ) {
    errors.push("Add at least two complete pairs.");
  }

  if (
    mode === "fill_blank" &&
    value.acceptedAnswers.filter((answer) =>
      answer.trim()
    ).length < 1
  ) {
    errors.push("Add at least one accepted answer.");
  }

  return errors;
}
