import ListeningTranscript from "./ListeningTranscript";
import ListeningInstructions from "./ListeningInstructions";
import AudioPlayer from "./AudioPlayer";

import Card from "../ui/Card";
import ToggleSection from "../ui/ToggleSection";
import type { ListeningData } from "../../types/ListeningData";

type Props = {
  listening: ListeningData;
};

function ListeningCard({ listening }: Props) {
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
    </Card>
  );
}

export default ListeningCard;