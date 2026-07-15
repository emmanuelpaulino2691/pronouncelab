import type { LessonData } from "../../../shared/types/LessonData";

type Props = {
  lesson: LessonData;
};

function QuizActivity({ lesson }: Props) {
  return (
    <div className="space-y-4">
      {(lesson.quiz ?? []).map((quiz) => (
        <div
          key={quiz.id}
          className="rounded-lg border p-4"
        >
          <h2 className="text-xl font-semibold">
            {quiz.title}
          </h2>

          <ol className="mt-4 list-decimal space-y-2 pl-6">
            {quiz.questions.map((question, index) => (
              <li key={index}>
                {question}
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

export default QuizActivity;
