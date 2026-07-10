import Card from "../ui/Card";
import MultipleChoiceQuestion from "./MultipleChoiceQuestion";

type Props = {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  onAnswered?: (isCorrect: boolean) => void;
};

function MultipleChoiceQuestionCard({
  id,
  question,
  options,
  correctAnswer,
  onAnswered,
}: Props) {
  return (
    <Card title={`Question ${id}`}>
      <MultipleChoiceQuestion
        question={question}
        options={options}
        correctAnswer={correctAnswer}
        onAnswered={onAnswered}
      />
    </Card>
  );
}

export default MultipleChoiceQuestionCard;