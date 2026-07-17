import ListeningTranscript from "./ListeningTranscript";
import ListeningInstructions from "./ListeningInstructions";
import ListeningQuestionCard from "./ListeningQuestionCard";
import AudioPlayer from "./AudioPlayer";

import Card from "../ui/Card";
import ToggleSection from "../ui/ToggleSection";
import QuestionGroup from "../questions/QuestionGroup";

import type { ListeningData } from "../../types/ListeningData";

type Props = {
  listening: ListeningData;
  onReadyChange?: (ready: boolean) => void;
};

function ListeningCard({
  listening,
  onReadyChange,
}: Props) {
  return (
    <Card title={listening.title}>
      {listening.instructions && (
        <ListeningInstructions text={listening.instructions} />
      )}

      <AudioPlayer src={listening.audio} />

      {listening.transcript && (
        <ToggleSection buttonText="Show Transcript">
          <ListeningTranscript text={listening.transcript} />
        </ToggleSection>
      )}

      {listening.questions && (
        <QuestionGroup
          totalQuestions={listening.questions.length}
          onReadyChange={onReadyChange}
        >
          {listening.questions.map((question) => (
            <ListeningQuestionCard
              key={question.id}
              question={question}
            />
          ))}
        </QuestionGroup>
      )}
    </Card>
  );
}

export default ListeningCard;
