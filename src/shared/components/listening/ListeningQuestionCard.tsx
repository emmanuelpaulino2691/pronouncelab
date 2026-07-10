import MultipleChoiceQuestionCard from "../questions/MultipleChoiceQuestionCard";

import type { ListeningQuestion } from "../../types/ListeningQuestion";

type Props = {
  question: ListeningQuestion;
};

function ListeningQuestionCard({ question }: Props) {
  return (
    <MultipleChoiceQuestionCard
      id={question.id}
      question={question.question}
      options={question.options}
      correctAnswer={question.correctAnswer}
    />
  );
}

export default ListeningQuestionCard;