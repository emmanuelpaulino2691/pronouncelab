import QuestionGroup from "../questions/QuestionGroup";
import MultipleChoiceQuestionCard from "../questions/MultipleChoiceQuestionCard";

import type { PracticeData } from "../../types/PracticeData";

type Props = {
  practice: PracticeData;
  onReadyChange?: (ready: boolean) => void;
};

function PracticeCard({
  practice,
  onReadyChange,
}: Props) {
  return (
    <>
      {practice.instructions && (
        <p className="mb-6 text-slate-600">{practice.instructions}</p>
      )}

      {practice.questions && (
        <QuestionGroup
          totalQuestions={practice.questions.length}
          onReadyChange={onReadyChange}
        >
          {practice.questions.map((question) => (
            <MultipleChoiceQuestionCard
              key={question.id}
              id={question.id}
              question={question.question}
              options={question.options}
              correctAnswer={question.correctAnswer}
            />
          ))}
        </QuestionGroup>
      )}
    </>
  );
}

export default PracticeCard;
