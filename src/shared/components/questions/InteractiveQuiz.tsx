import { useState } from "react";

import MultipleChoiceQuestionCard from "./MultipleChoiceQuestionCard";

import type { MultipleChoiceQuestion } from "../../types/MultipleChoiceQuestion";

type Props = {
  questions: MultipleChoiceQuestion[];
};

type AnswerState = {
  selectedOption: number | null;
  submitted: boolean;
  isCorrect: boolean;
};

function createInitialAnswers(
  totalQuestions: number
): AnswerState[] {
  return Array.from(
    { length: totalQuestions },
    () => ({
      selectedOption: null,
      submitted: false,
      isCorrect: false,
    })
  );
}

function InteractiveQuiz({
  questions,
}: Props) {
  const [currentQuestion, setCurrentQuestion] =
    useState(0);
  const [answers, setAnswers] = useState(
    () => createInitialAnswers(questions.length)
  );
  const [showResults, setShowResults] =
    useState(false);

  if (questions.length === 0) {
    return (
      <p role="status" className="text-slate-600">
        No quiz questions are available yet.
      </p>
    );
  }

  const question = questions[currentQuestion];
  const answer = answers[currentQuestion];
  const correctAnswers = answers.filter(
    (item) => item.isCorrect
  ).length;
  const percentage = Math.round(
    (correctAnswers / questions.length) * 100
  );

  function updateAnswer(
    update: Partial<AnswerState>
  ) {
    setAnswers((previous) =>
      previous.map((item, index) =>
        index === currentQuestion
          ? { ...item, ...update }
          : item
      )
    );
  }

  function restartQuiz() {
    setAnswers(
      createInitialAnswers(questions.length)
    );
    setCurrentQuestion(0);
    setShowResults(false);
  }

  if (showResults) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-lg bg-slate-50 p-5"
      >
        <h3 className="text-xl font-semibold">
          Quiz Results
        </h3>

        <p className="mt-3 text-lg">
          You answered {correctAnswers} of{" "}
          {questions.length} questions correctly.
        </p>

        <p className="mt-1 font-semibold">
          Score: {percentage}%
        </p>

        <button
          type="button"
          onClick={restartQuiz}
          className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Restart Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">
        Question {currentQuestion + 1} of{" "}
        {questions.length}
      </p>

      <MultipleChoiceQuestionCard
        id={question.id}
        question={question.question}
        options={question.options}
        correctAnswer={question.correctAnswer}
        explanation={question.explanation}
        selectedOption={answer.selectedOption}
        submitted={answer.submitted}
        onSelect={(selectedOption) =>
          updateAnswer({ selectedOption })
        }
        onAnswered={(isCorrect) =>
          updateAnswer({
            submitted: true,
            isCorrect,
          })
        }
      />

      <div className="flex flex-wrap justify-between gap-3">
        <button
          type="button"
          disabled={currentQuestion === 0}
          onClick={() =>
            setCurrentQuestion(
              (value) => value - 1
            )
          }
          className="rounded-lg bg-slate-200 px-4 py-2 transition hover:bg-slate-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          ← Previous Question
        </button>

        {currentQuestion <
        questions.length - 1 ? (
          <button
            type="button"
            disabled={!answer.submitted}
            onClick={() =>
              setCurrentQuestion(
                (value) => value + 1
              )
            }
            className="rounded-lg bg-slate-700 px-4 py-2 text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next Question →
          </button>
        ) : (
          <button
            type="button"
            disabled={!answer.submitted}
            onClick={() => setShowResults(true)}
            className="rounded-lg bg-green-600 px-4 py-2 text-white transition hover:bg-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            View Results
          </button>
        )}
      </div>
    </div>
  );
}

export default InteractiveQuiz;
