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

          {"blockType" in item ? <>
            {item.instructions && <p className="mt-2 text-slate-700">{item.instructions}</p>}
            {item.spellingPattern && <p className="mt-3 text-sm font-semibold text-blue-700">Pattern: {item.spellingPattern}</p>}
            {item.blockType === "word_list" ? <ul className="mt-4 space-y-2" aria-label={`${item.title} words`}>
              {item.entries.filter((entry): entry is string => typeof entry === "string").map((word, index) => <li key={`${word}-${index}`} className="rounded-lg bg-slate-50 px-4 py-2 font-medium">{word}</li>)}
            </ul> : <div className="mt-4 overflow-hidden rounded-xl border border-slate-200" role="table" aria-label={`${item.title} minimal pairs`}>
              {item.entries.filter((entry): entry is { left: string; right: string } => typeof entry !== "string").map((pair, index) => <div key={`${pair.left}-${pair.right}-${index}`} role="row" className="grid grid-cols-2 border-b border-slate-200 last:border-b-0"><span role="cell" className="break-words border-r border-slate-200 p-3 text-center font-medium">{pair.left}</span><span role="cell" className="break-words p-3 text-center font-medium">{pair.right}</span></div>)}
            </div>}
          </> : <p className="mt-2 text-slate-700">{item.text}</p>}

          <div className="mt-4">
            {item.audio && <AudioPlayer src={item.audio} />}
          </div>
        </div>
      ))}
    </div>
  );
}

export default PronunciationActivity;
