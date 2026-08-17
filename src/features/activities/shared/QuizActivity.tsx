import InteractiveQuiz from "../../../shared/components/questions/InteractiveQuiz";
import { useAssessmentReadiness } from "../../../shared/hooks/useAssessmentReadiness";

import type { LessonData } from "../../../shared/types/LessonData";
import type { LessonActivity } from "../../../shared/types/LessonActivity";

type Props = {
  activity?: LessonActivity;
  lesson: LessonData;
  onReadyChange?: (ready: boolean) => void;
};

function QuizActivity({
  lesson,
  onReadyChange,
}: Props) {
  const quizzes = lesson.quiz ?? [];

  const requiredKeys = quizzes.flatMap(
    (quiz, index) =>
      quiz.interactiveQuestions &&
      quiz.interactiveQuestions.length > 0
        ? [`quiz-${index}`]
        : []
  );

  const setQuizReady =
    useAssessmentReadiness(
      requiredKeys,
      onReadyChange
    );

  return (
    <div className="space-y-4">
      {quizzes.map((quiz, index) => (
        <div
          key={`${lesson.id}-${quiz.id}`}
          className="rounded-lg border p-4"
        >
          <h2 className="text-xl font-semibold">
            {quiz.title}
          </h2>

          <div className="mt-4">
            {quiz.interactiveQuestions &&
            quiz.interactiveQuestions.length > 0 ? (
              <InteractiveQuiz
                questions={
                  quiz.interactiveQuestions
                }
                onReadyChange={(ready) =>
                  setQuizReady(
                    `quiz-${index}`,
                    ready
                  )
                }
              />
            ) : quiz.questions.length > 0 ? (
              <ol className="list-decimal space-y-2 pl-6">
                {quiz.questions.map(
                  (question, index) => (
                    <li key={index}>
                      {question}
                    </li>
                  )
                )}
              </ol>
            ) : (
              <p
                role="status"
                className="text-slate-600"
              >
                No quiz questions are available yet.
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default QuizActivity;
