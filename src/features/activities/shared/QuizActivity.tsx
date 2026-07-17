import InteractiveQuiz from "../../../shared/components/questions/InteractiveQuiz";

import type { LessonData } from "../../../shared/types/LessonData";

type Props = {
  lesson: LessonData;
};

function QuizActivity({ lesson }: Props) {
  return (
    <div className="space-y-4">
      {(lesson.quiz ?? []).map((quiz) => (
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
