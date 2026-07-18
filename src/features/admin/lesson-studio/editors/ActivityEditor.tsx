import { lazy, Suspense } from "react";
import ActivityMetadataEditor from "../components/ActivityMetadataEditor";
import type { LessonActivity } from "../types";
import ListeningEditor from "./ListeningEditor";
import PronunciationEditor from "./PronunciationEditor";
import QuizEditor from "./QuizEditor";
import TheoryEditor from "./TheoryEditor";

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
};

export default function ActivityEditor({
  activity,
  editable,
  busy,
  onSaveMetadata,
}: Props) {
  return (
    <div className="space-y-5">
      <ActivityMetadataEditor
        activity={activity}
        editable={editable}
        busy={busy}
        onSave={onSaveMetadata}
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
        />
      )}
      {activity.type === "pronunciation" && (
        <PronunciationEditor
          key={activity.id}
          activityId={activity.id}
          editable={editable}
        />
      )}
      {activity.type === "practice" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
          Practice currently has no subtype or JSON
          content fields in the database. Activity title
          and required state are available above; exercise
          authoring is deferred until the schema supports
          it.
        </section>
      )}
      {activity.type === "quiz" && (
        <QuizEditor
          key={activity.id}
          activityId={activity.id}
          editable={editable}
        />
      )}
      {activity.type === "ai_speaking_mission" && (
        <Suspense fallback={<section className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">Loading AI mission editor…</section>}>
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
