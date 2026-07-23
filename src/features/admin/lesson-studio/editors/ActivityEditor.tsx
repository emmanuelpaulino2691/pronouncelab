import { lazy, Suspense, useRef } from "react";
import ActivityMetadataEditor from "../components/ActivityMetadataEditor";
import type { LessonActivity } from "../types";
import ListeningEditor from "./ListeningEditor";
import PronunciationEditor from "./PronunciationEditor";
import QuizEditor from "./QuizEditor";
import TheoryEditor from "./TheoryEditor";
import InteractivePracticeEditor from "./InteractivePracticeEditor";

const AiSpeakingMissionEditor = lazy(
  () => import("./AiSpeakingMissionEditor")
);

type Props = {
  activity: LessonActivity;
  editable: boolean;
  busy: boolean;
  onSaveMetadata: (
    input: Pick<LessonActivity, "title" | "required">
  ) => Promise<void>;
  onDirtyChange: (dirty: boolean) => void;
};

export default function ActivityEditor({
  activity,
  editable,
  busy,
  onSaveMetadata,
  onDirtyChange,
}: Props) {
  const dirtySources = useRef(new Map<string, boolean>());
  function reportDirty(source: string, dirty: boolean) {
    dirtySources.current.set(source, dirty);
    onDirtyChange([...dirtySources.current.values()].some(Boolean));
  }
  return (
    <div className="space-y-5">
      <ActivityMetadataEditor
        activity={activity}
        editable={editable}
        busy={busy}
        onSave={async (input) => { await onSaveMetadata(input); reportDirty("metadata", false); }}
        onDirtyChange={(dirty) => reportDirty("metadata", dirty)}
      />
      {activity.type === "theory" && (
        <TheoryEditor
          key={activity.id}
          activityId={activity.id}
          editable={editable}
        />
      )}
      {activity.type === "listening" && (
        <ListeningEditor
          key={activity.id}
          activityId={activity.id}
          editable={editable}
          onDirtyChange={(dirty) => reportDirty("listening", dirty)}
        />
      )}
      {activity.type === "pronunciation" && (
        <PronunciationEditor
          key={activity.id}
          activityId={activity.id}
          editable={editable}
          onDirtyChange={(dirty) => reportDirty("pronunciation", dirty)}
        />
      )}
      {activity.type === "practice" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
          <h2 className="font-semibold text-slate-950">Existing Practice activity</h2>
          <p className="mt-2 leading-6">
            This activity remains available for compatibility with existing lessons. You can update its title and required status above, while its existing lesson position and actions remain supported.
          </p>
        </section>
      )}
      {activity.type === "quiz" && (
        <QuizEditor
          key={activity.id}
          activityId={activity.id}
          editable={editable}
        />
      )}
      {activity.type === "interactive_practice" && (
        <InteractivePracticeEditor
          key={activity.id}
          activityId={activity.id}
          editable={editable}
        />
      )}
      {activity.type === "ai_speaking_mission" && (
        <Suspense fallback={<section role="status" className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">Loading AI Speaking Mission editor…</section>}>
          <AiSpeakingMissionEditor
            key={activity.id}
            activityId={activity.id}
            editable={editable}
          />
        </Suspense>
      )}
    </div>
  );
}
