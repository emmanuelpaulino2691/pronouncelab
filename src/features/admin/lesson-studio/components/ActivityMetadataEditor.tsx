import { useState } from "react";

import { getActivityPresentation } from "../activityCatalog";
import type { LessonActivity } from "../types";

type Props = {
  activity: LessonActivity;
  editable: boolean;
  busy: boolean;
  onSave: (
    input: Pick<LessonActivity, "title" | "required">
  ) => Promise<void>;
  onDirtyChange: (dirty: boolean) => void;
};

export default function ActivityMetadataEditor({
  activity,
  editable,
  busy,
  onSave,
  onDirtyChange,
}: Props) {
  const [title, setTitle] = useState(
    activity.title
  );
  const [required, setRequired] = useState(
    activity.required
  );

  return (
    <form
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        void onSave({ title, required });
      }}
    >
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-950">
          Activity settings
        </h2>
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {getActivityPresentation(activity.type).title}
        </span>
      </div>
      <label className="mt-4 block text-sm font-medium text-slate-700">
        Title
        <input
          value={title}
          disabled={!editable || busy}
          onChange={(event) =>
            { const value = event.target.value; setTitle(value); onDirtyChange(value !== activity.title || required !== activity.required); }
          }
          required
          className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
        />
      </label>
      <label className="mt-4 flex items-center gap-3 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={required}
          disabled={!editable || busy}
          onChange={(event) =>
            { const value = event.target.checked; setRequired(value); onDirtyChange(title !== activity.title || value !== activity.required); }
          }
          className="h-4 w-4 rounded border-slate-300"
        />
        Required activity
      </label>
      {editable && (
        <button
          type="submit"
          disabled={busy || !title.trim()}
          className="mt-5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
        >
          {busy ? "Saving…" : "Save settings"}
        </button>
      )}
    </form>
  );
}
