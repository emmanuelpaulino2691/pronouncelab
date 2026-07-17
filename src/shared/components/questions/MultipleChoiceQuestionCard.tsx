import Card from "../ui/Card";
import MultipleChoiceQuestion from "./MultipleChoiceQuestion";

type Props = {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  selectedOption?: number | null;
  submitted?: boolean;
  onSelect?: (optionIndex: number) => void;
  onAnswered?: (isCorrect: boolean) => void;
};

function MultipleChoiceQuestionCard({
  id,
  question,
  options,
  correctAnswer,
  explanation,
  selectedOption,
  submitted,
  onSelect,
  onAnswered,
}: Props) {
  return (
    <Card title={`Question ${id}`}>
      <MultipleChoiceQuestion
        question={question}
        options={options}
        correctAnswer={correctAnswer}
        explanation={explanation}
        selectedOption={selectedOption}
        submitted={submitted}
        onSelect={onSelect}
        onAnswered={onAnswered}
      />
    </Card>
  );
}

export default MultipleChoiceQuestionCard;
