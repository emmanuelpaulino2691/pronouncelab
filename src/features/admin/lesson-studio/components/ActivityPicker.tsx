import { useRef, useState } from "react";

import { activityCatalog } from "../activityCatalog";
import {
  beginActivityCreation,
  completeActivityCreation,
  failActivityCreation,
  openActivityPicker,
} from "../activityPickerState";
import type { ActivityType } from "../types";
import { AdminIcon, Alert, Badge, Button, Card, Dialog, Spinner } from "../../ui";

type ActivityPickerProps = {
  onClose: () => void;
  onCreate: (type: ActivityType) => Promise<void>;
};

export default function ActivityPicker({ onClose, onCreate }: ActivityPickerProps) {
  const [state, setState] = useState(openActivityPicker);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const submissionRef = useRef(false);
  const firstChoiceRef = useRef<HTMLButtonElement>(null);
  const isSubmitting = state.status === "submitting";

  async function create(type: ActivityType) {
    if (submissionRef.current) return;
    const next = beginActivityCreation(state, type);
    if (next === state) return;

    submissionRef.current = true;
    setState(next);
    setErrorMessage(null);
    try {
      await onCreate(type);
      setState((current) => completeActivityCreation(current));
    } catch {
      setState((current) => failActivityCreation(current));
      setErrorMessage(
        "The activity could not be added. Your selection is still available, so you can try again."
      );
    } finally {
      submissionRef.current = false;
    }
  }

  return (
    <Dialog
      isOpen
      onClose={onClose}
      preventClose={isSubmitting}
      initialFocusRef={firstChoiceRef}
      title="Add Activity"
      description="What is the student expected to do? Choose the activity that best supports that learning purpose."
      className="max-w-4xl"
    >
      {errorMessage && <div className="mb-5"><Alert tone="error">{errorMessage}</Alert></div>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {activityCatalog.map((activity, index) => {
          const selected = state.selectedType === activity.type;
          return (
            <Card
              key={activity.type}
              className={`flex min-w-0 flex-col p-5 ${selected ? "border-blue-400 ring-2 ring-blue-100" : ""} ${activity.canCreate ? "" : "border-dashed bg-slate-50"}`}
              aria-disabled={!activity.canCreate || undefined}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
                  <AdminIcon name={activity.icon} className="h-5 w-5" />
                </span>
                <Badge tone={activity.category === "AI" ? "info" : "neutral"}>{activity.category}</Badge>
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-950">{activity.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{activity.description}</p>
              {activity.canCreate ? (
                <button
                  ref={index === 0 ? firstChoiceRef : undefined}
                  type="button"
                  className="admin-focus mt-5 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isSubmitting}
                  onClick={() => void create(activity.type)}
                >
                  {isSubmitting && selected && <Spinner />}
                  {isSubmitting && selected ? "Creating activity…" : `Add ${activity.title}`}
                </button>
              ) : (
                <div className="mt-5">
                  <p className="mb-2 text-xs font-semibold text-slate-600">Existing Practice activities can still be edited</p>
                  <Button type="button" variant="secondary" className="w-full" disabled aria-disabled="true">
                    Cannot add new Practice
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </Dialog>
  );
}
