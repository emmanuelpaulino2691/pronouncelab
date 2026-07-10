import { useState } from "react";

type Props = {
  question: string;
  options: string[];
  correctAnswer: number;
  onAnswered?: (isCorrect: boolean) => void;
};

function MultipleChoiceQuestion({
  question,
  options,
  correctAnswer,
  onAnswered,
}: Props) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  return (
    <>
      <p className="font-medium">{question}</p>

      <div className="mt-4 space-y-2">
        {options.map((option, index) => (
          <button
            key={index}
            type="button"
            disabled={checked}
            onClick={() => setSelectedOption(index)}
            className={`block w-full rounded-lg border px-4 py-2 text-left transition ${
              checked
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
  onClick={() => {
    setChecked(true);

    onAnswered?.(selectedOption === correctAnswer);
  }}
        disabled={selectedOption === null || checked}
        className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        Check Answer
      </button>

      {checked && (
        <p
          className={`mt-4 font-medium ${
            selectedOption === correctAnswer
              ? "text-green-600"
              : "text-red-600"
          }`}
        >
          {selectedOption === correctAnswer
            ? "Correct!"
            : "Incorrect."}
        </p>
      )}
    </>
  );
}

export default MultipleChoiceQuestion;