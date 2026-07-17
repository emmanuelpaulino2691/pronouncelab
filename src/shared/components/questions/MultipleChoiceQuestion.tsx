import { useState } from "react";

type Props = {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  selectedOption?: number | null;
  submitted?: boolean;
  onSelect?: (optionIndex: number) => void;
  onAnswered?: (isCorrect: boolean) => void;
};

function MultipleChoiceQuestion({
  question,
  options,
  correctAnswer,
  explanation,
  selectedOption: controlledSelectedOption,
  submitted: controlledSubmitted,
  onSelect,
  onAnswered,
}: Props) {
  const [internalSelectedOption, setInternalSelectedOption] =
    useState<number | null>(null);
  const [internalSubmitted, setInternalSubmitted] =
    useState(false);

  const selectedOption =
    controlledSelectedOption === undefined
      ? internalSelectedOption
      : controlledSelectedOption;

  const submitted =
    controlledSubmitted === undefined
      ? internalSubmitted
      : controlledSubmitted;

  function handleSelect(optionIndex: number) {
    setInternalSelectedOption(optionIndex);
    onSelect?.(optionIndex);
  }

  function handleSubmit() {
    if (selectedOption === null) {
      return;
    }

    setInternalSubmitted(true);
    onAnswered?.(
      selectedOption === correctAnswer
    );
  }

  return (
    <>
      <p className="font-medium">{question}</p>

      <div className="mt-4 space-y-2">
        {options.map((option, index) => (
          <button
            key={index}
            type="button"
            disabled={submitted}
            aria-pressed={
              selectedOption === index
            }
            onClick={() => handleSelect(index)}
            className={`block w-full rounded-lg border px-4 py-2 text-left transition ${
              submitted
                ? index === correctAnswer
                  ? "border-green-600 bg-green-100"
                  : selectedOption === index
                  ? "border-red-600 bg-red-100"
                  : "border-slate-300"
                : selectedOption === index
                ? "border-blue-600 bg-blue-100"
                : "border-slate-300 hover:bg-slate-100"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={
          selectedOption === null ||
          submitted
        }
        className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        Check Answer
      </button>

      {submitted && (
        <div
          role="status"
          aria-live="polite"
          className="mt-4 space-y-2"
        >
          <p
            className={`font-medium ${
            selectedOption === correctAnswer
              ? "text-green-600"
              : "text-red-600"
          }`}
          >
            {selectedOption === correctAnswer
              ? "Correct!"
              : `Incorrect. The correct answer is ${options[correctAnswer]}.`}
          </p>

          {explanation && (
            <p className="text-slate-700">
              {explanation}
            </p>
          )}
        </div>
      )}
    </>
  );
}

export default MultipleChoiceQuestion;
