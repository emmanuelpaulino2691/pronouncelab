import { useEffect, useRef, useState } from "react";
import ActivityRenderer from "../../../activities/shared/ActivityRenderer";
import { mapDraftLessonToLearnerLessonData } from "../../preview/teacherPreviewSources";
import { savedPreviewNotice, supportsSavedActivityPreview } from "../studioViewState";
import type { LessonActivity } from "../types";
import type { LearnerActivity } from "../../../../shared/content/contracts/learnerActivities";

export default function SavedActivityPreview({ activity, dirty }: { activity: LessonActivity; dirty: boolean }) {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{ status: "loading" | "ready" | "error"; activity?: LearnerActivity }>({ status: "loading" });
  const generation = useRef(0);
  useEffect(() => {
    if (!supportsSavedActivityPreview(activity.type)) return;
    const request = ++generation.current;
    void Promise.resolve().then(() => { if (request === generation.current) setState({ status: "loading" }); });
    void mapDraftLessonToLearnerLessonData({ id: activity.lessonVersionId, unitId: 0, title: "Saved activity preview", description: "" }, 0, [activity])
      .then((lesson) => { if (request === generation.current) setState(lesson.activities[0] ? { status: "ready", activity: lesson.activities[0] } : { status: "error" }); })
      .catch(() => { if (request === generation.current) setState({ status: "error" }); });
    return () => { generation.current += 1; };
  }, [activity, revision]);

  if (!supportsSavedActivityPreview(activity.type)) return <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><h2 className="font-semibold text-slate-950">Saved-content Student Preview</h2><p className="mt-3 text-sm text-slate-600">Preview is not available for this activity yet.</p></aside>;
  return <aside className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between gap-3"><h2 className="font-semibold text-slate-950">Saved-content Student Preview</h2><button type="button" onClick={() => setRevision((value) => value + 1)} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold">Refresh Preview</button></div>
    {savedPreviewNotice(dirty) && <p role="status" className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Preview shows the last saved version.</p>}
    {state.status === "loading" && <p role="status" className="mt-4 text-sm text-slate-600">Loading saved preview…</p>}
    {state.status === "error" && <div role="alert" className="mt-4 rounded-xl border border-amber-200 bg-white p-4 text-sm text-amber-900"><p>Saved preview could not be loaded. Your editor changes are unaffected.</p><button type="button" onClick={() => setRevision((value) => value + 1)} className="mt-3 font-semibold underline">Retry</button></div>}
    {state.status === "ready" && state.activity && <div className="mt-4 min-w-0 rounded-xl bg-white p-4"><ActivityRenderer activity={state.activity} onReadyChange={() => undefined} /></div>}
  </aside>;
}
