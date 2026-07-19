import AudioPlayer from "../../../shared/components/listening/AudioPlayer";

import type { LessonData } from "../../../shared/types/LessonData";
import type { LessonActivity } from "../../../shared/types/LessonActivity";

type Props = {
  activity?: LessonActivity;
  lesson: LessonData;
  onReadyChange?: (ready: boolean) => void;
};

function PronunciationActivity({ lesson }: Props) {
  return (
    <div className="space-y-4">
      {(lesson.pronunciation ?? []).map((item) => (
        <div
          key={item.id}
          className="rounded-lg border p-4"
        >
          <h2 className="text-xl font-semibold">
            {item.title}
          </h2>

          <p className="mt-2 text-slate-700">
            {item.text}
          </p>

          <div className="mt-4">
            <AudioPlayer src={item.audio} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default PronunciationActivity;
