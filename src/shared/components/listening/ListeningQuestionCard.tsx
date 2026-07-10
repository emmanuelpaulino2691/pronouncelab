import Card from "../ui/Card";
import MultipleChoiceQuestion from "../questions/MultipleChoiceQuestion";

import type { ListeningQuestion } from "../../types/ListeningQuestion";

type Props = {
  question: ListeningQuestion;
};

function ListeningQuestionCard({ question }: Props) {
  return (
    <Card title={`Question ${question.id}`}>
      <MultipleChoiceQuestion
        question={question.question}
        options={question.options}
        correctAnswer={question.correctAnswer}
      />
    </Card>
  );
}

export default ListeningQuestionCard;