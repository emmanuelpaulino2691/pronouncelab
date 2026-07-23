import ListeningTranscript from "./ListeningTranscript";
import ListeningInstructions from "./ListeningInstructions";
import ListeningQuestionCard from "./ListeningQuestionCard";
import AudioPlayer from "./AudioPlayer";

import Card from "../ui/Card";
import ToggleSection from "../ui/ToggleSection";
import QuestionGroup from "../questions/QuestionGroup";

import type { ListeningData } from "../../types/ListeningData";
import { hasListeningTranscript } from "./listeningPresentation";

type Props = {
  listening: ListeningData;
  onReadyChange?: (ready: boolean) => void;
};

function ListeningCard({
  listening,
  onReadyChange,
}: Props) {
  const transcript = listening.transcript?.trim();
  return (
    <Card title={listening.title}>
      {listening.instructions && (
        <ListeningInstructions text={listening.instructions} />
      )}

      {listening.audio && <AudioPlayer src={listening.audio} />}

      {hasListeningTranscript(transcript) && transcript && (
        <ToggleSection buttonText="Show transcript" closeButtonText="Hide transcript" regionLabel="Listening transcript">
          <ListeningTranscript text={transcript} />
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
