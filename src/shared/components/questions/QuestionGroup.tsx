import {
  cloneElement,
  useEffect,
  useState,
} from "react";
import type { ReactElement } from "react";

type Props = {
  totalQuestions: number;
  children: ReactElement<QuestionProps>[];
  onReadyChange?: (ready: boolean) => void;
};

type QuestionProps = {
  onAnswered?: (isCorrect: boolean) => void;
};

function QuestionGroup({
  totalQuestions,
  children,
  onReadyChange,
}: Props) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [submittedQuestions, setSubmittedQuestions] =
    useState<boolean[]>(
      () =>
        Array.from(
          { length: totalQuestions },
          () => false
        )
    );

  const allSubmitted =
    totalQuestions === 0 ||
    submittedQuestions.every(Boolean);

  useEffect(() => {
    onReadyChange?.(allSubmitted);
  }, [allSubmitted, onReadyChange]);

  if (totalQuestions === 0) {
    return (
      <p role="status" className="text-slate-600">
        No questions are required for this activity.
      </p>
    );
  }

  const currentChild =
    children[currentQuestion];
  const currentSubmitted =
    submittedQuestions[currentQuestion] ??
    false;

  const question = cloneElement(
    currentChild,
    {
      onAnswered: (isCorrect: boolean) => {
        currentChild.props.onAnswered?.(
          isCorrect
        );

        setSubmittedQuestions((previous) =>
          previous.map((submitted, index) =>
            index === currentQuestion
              ? true
              : submitted
          )
        );
      },
    }
  );

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500">
        Question {currentQuestion + 1} of {totalQuestions}
      </p>

      {question}

      {!currentSubmitted && (
        <p
          role="status"
          className="text-sm font-medium text-amber-700"
        >
          Submit an answer to continue to the next question.
        </p>
      )}

      {currentQuestion < totalQuestions - 1 && (
        <button
          type="button"
          disabled={!currentSubmitted}
          onClick={() => setCurrentQuestion((value) => value + 1)}
          className="rounded-lg bg-slate-700 px-4 py-2 text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next Question
        </button>
      )}
    </div>
  );
}

export default QuestionGroup;
