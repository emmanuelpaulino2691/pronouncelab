import { lazy, Suspense, useCallback, useRef, useState } from "react";
import ActivityMetadataEditor from "../components/ActivityMetadataEditor";
import type { LessonActivity } from "../types";
import LessonStudioWorkspaceToolbar from "../components/LessonStudioWorkspaceToolbar";
import SavedActivityPreview from "../components/SavedActivityPreview";
import { activityTypeLabels } from "../types";
import type { ActivitySectionCollapseController, StudioViewMode } from "../studioViewState";
import EditorChunkBoundary from "../components/EditorChunkBoundary";
import EditorLoadingState from "../components/EditorLoadingState";
import { activityEditorLoaders } from "./activityEditorModules";

const TheoryEditor = lazy(activityEditorLoaders.theory);
const ListeningEditor = lazy(activityEditorLoaders.listening);
const PronunciationEditor = lazy(activityEditorLoaders.pronunciation);
const LegacyPracticeEditor = lazy(activityEditorLoaders.practice);
const QuizEditor = lazy(activityEditorLoaders.quiz);
const InteractivePracticeEditor = lazy(activityEditorLoaders.interactive_practice);
const AiSpeakingMissionEditor = lazy(activityEditorLoaders.ai_speaking_mission);

type Props = {
  activity: LessonActivity;
  editable: boolean;
  busy: boolean;
  onSaveMetadata: (
    input: Pick<LessonActivity, "title" | "required">
  ) => Promise<void>;
  onDirtyChange: (dirty: boolean) => void;
  viewMode: StudioViewMode;
  onViewModeChange: (mode: StudioViewMode) => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
};

export default function ActivityEditor({
  activity,
  editable,
  busy,
  onSaveMetadata,
  onDirtyChange,
  viewMode,
  onViewModeChange,
  collapsed,
  onCollapsedChange,
}: Props) {
  const dirtySources = useRef(new Map<string, boolean>());
  const [dirty, setDirty] = useState(false);
  const [sectionController, setSectionController] = useState<ActivitySectionCollapseController | null>(null);
  const reportDirty = useCallback((source: string, value: boolean) => {
    dirtySources.current.set(source, value);
    const next = [...dirtySources.current.values()].some(Boolean);
    setDirty(next); onDirtyChange(next);
  }, [onDirtyChange]);
  const registerSectionController = useCallback((controller: ActivitySectionCollapseController | null) => setSectionController(controller), []);
  return (
    <div className="space-y-5">
      <LessonStudioWorkspaceToolbar viewMode={viewMode} onViewModeChange={onViewModeChange} sectionController={sectionController} />
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-xs font-bold uppercase tracking-wide text-blue-600">{activityTypeLabels[activity.type]}</p><h2 className="mt-1 font-semibold text-slate-950">{activity.title || "Untitled activity"}</h2><p className="mt-1 text-xs text-slate-500">{activity.required ? "Required" : "Optional"} · {dirty ? "Unsaved changes" : "Saved"}</p></div>
          <button type="button" aria-expanded={!collapsed} aria-controls={`activity-editor-${activity.id}`} onClick={() => onCollapsedChange(!collapsed)} className="min-h-10 rounded-lg border border-slate-300 px-3 text-sm font-semibold">{collapsed ? "Expand activity" : "Collapse activity"}</button>
        </div>
      </section>
      <div id={`activity-editor-${activity.id}`} hidden={collapsed} className={viewMode === "split" ? "grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.85fr)]" : ""}>
      <div className="min-w-0 space-y-5">
      <ActivityMetadataEditor
        activity={activity}
        editable={editable}
        busy={busy}
        onSave={async (input) => { await onSaveMetadata(input); reportDirty("metadata", false); }}
        onDirtyChange={(dirty) => reportDirty("metadata", dirty)}
      />
      <EditorChunkBoundary><Suspense fallback={<EditorLoadingState />}>
      {activity.type === "theory" && (
        <TheoryEditor
          key={activity.id}
          activityId={activity.id}
          editable={editable}
          onDirtyChange={(dirty) => reportDirty("theory", dirty)}
          onSectionControllerChange={registerSectionController}
        />
      )}
      {activity.type === "listening" && (
        <ListeningEditor
          key={activity.id}
          activityId={activity.id}
          editable={editable}
          onDirtyChange={(dirty) => reportDirty("listening", dirty)}
          onSectionControllerChange={registerSectionController}
        />
      )}
      {activity.type === "pronunciation" && (
        <PronunciationEditor
          key={activity.id}
          activityId={activity.id}
          editable={editable}
          onDirtyChange={(dirty) => reportDirty("pronunciation", dirty)}
          onSectionControllerChange={registerSectionController}
        />
      )}
      {activity.type === "practice" && (
        <LegacyPracticeEditor activityId={activity.id} onSectionControllerChange={registerSectionController} />
      )}
      {activity.type === "quiz" && (
        <QuizEditor
          key={activity.id}
          activityId={activity.id}
          editable={editable}
          onDirtyChange={(dirty) => reportDirty("quiz", dirty)}
          onSectionControllerChange={registerSectionController}
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
          <AiSpeakingMissionEditor
            key={activity.id}
            activityId={activity.id}
            editable={editable}
            onDirtyChange={(dirty) => reportDirty("ai_speaking_mission", dirty)}
            onSectionControllerChange={registerSectionController}
          />
      )}
      </Suspense></EditorChunkBoundary>
      </div>
      {viewMode === "split" && <SavedActivityPreview activity={activity} dirty={dirty} />}
      </div>
    </div>
  );
}
