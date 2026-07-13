import { useState } from "react";
import type { ReactElement } from "react";

type Props = {
  totalQuestions: number;
  children: ReactElement[];
};

function QuestionGroup({ totalQuestions, children }: Props) {
  const [currentQuestion, setCurrentQuestion] = useState(0);

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500">
        Question {currentQuestion + 1} of {totalQuestions}
      </p>

      {children[currentQuestion]}

      {currentQuestion < totalQuestions - 1 && (
        <button
          type="button"
          onClick={() => setCurrentQuestion((value) => value + 1)}
          className="rounded-lg bg-slate-700 px-4 py-2 text-white hover:bg-slate-800"
        >
          Next Question
        </button>
      )}
    </div>
  );
}

export default QuestionGroup;