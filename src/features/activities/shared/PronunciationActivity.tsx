import AudioPlayer from "../../../shared/components/listening/AudioPlayer";

import type { LessonData } from "../../../shared/types/LessonData";

type Props = {
  lesson: LessonData;
};

function PronunciationActivity({ lesson }: Props) {
  return (
    <div className="space-y-6">
      {(lesson.pronunciation ?? []).map((item) => (
        <div key={item.id}>
          <h3 className="text-lg font-semibold">{item.title}</h3>

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