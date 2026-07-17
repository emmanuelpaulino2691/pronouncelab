import MultipleChoiceQuestionCard from "../questions/MultipleChoiceQuestionCard";

import type { ListeningQuestion } from "../../types/ListeningQuestion";

type Props = {
  question: ListeningQuestion;
  onAnswered?: (isCorrect: boolean) => void;
};

function ListeningQuestionCard({
  question,
  onAnswered,
}: Props) {
  return (
    <MultipleChoiceQuestionCard
      id={question.id}
      question={question.question}
      options={question.options}
      correctAnswer={question.correctAnswer}
      onAnswered={onAnswered}
    />
  );
}

export default ListeningQuestionCard;
