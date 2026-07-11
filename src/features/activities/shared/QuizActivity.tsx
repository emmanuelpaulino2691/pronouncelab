import type { LessonData } from "../../../shared/types/LessonData";

type Props = {
  lesson: LessonData;
};

function QuizActivity({ lesson }: Props) {
  return (
    <div className="space-y-6">
      {(lesson.quiz ?? []).map((quiz) => (
        <div key={quiz.id}>
          <h3 className="text-lg font-semibold">
            {quiz.title}
          </h3>

          <ol className="mt-4 list-decimal pl-6 space-y-2">
            {quiz.questions.map((question, index) => (
              <li key={index}>{question}</li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

export default QuizActivity;