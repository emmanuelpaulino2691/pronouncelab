import { useRef, useState } from "react";

import HierarchyItemForm, {
  type HierarchyItemInput,
} from "../components/HierarchyItemForm";
import { Badge, Button, Card, Dialog } from "../ui";
import {
  chooseBlankLesson,
  getInitialLessonCreationStage,
  returnToLessonChoice,
} from "./lessonCreationState";

type LessonCreationDialogProps = {
  nextPosition: number;
  isSaving: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (input: HierarchyItemInput) => void;
};

function LessonCreationDialog({
  nextPosition,
  isSaving,
  errorMessage,
  onClose,
  onSubmit,
}: LessonCreationDialogProps) {
  const [stage, setStage] = useState(getInitialLessonCreationStage);
  const blankLessonRef = useRef<HTMLButtonElement>(null);

  if (stage === "blank-form") {
    return (
      <HierarchyItemForm
        itemType="lesson"
        item={null}
        nextPosition={nextPosition}
        isSaving={isSaving}
        errorMessage={errorMessage}
        onCancel={onClose}
        onBack={() => setStage(returnToLessonChoice())}
        onSubmit={onSubmit}
      />
    );
  }

  return (
    <Dialog
      isOpen
      onClose={onClose}
      initialFocusRef={blankLessonRef}
      title="New Lesson"
      description="Choose how you want to start this lesson."
      className="max-w-3xl"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="flex min-w-0 flex-col p-5">
          <h3 className="text-lg font-bold text-slate-950">Blank Lesson</h3>
          <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
            Start with an empty draft and add the title, description, and learning order yourself.
          </p>
          <button
            ref={blankLessonRef}
            type="button"
            className="admin-focus mt-5 inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            onClick={() => setStage(chooseBlankLesson())}
          >
            Start blank lesson
          </button>
        </Card>

        <Card
          className="flex min-w-0 flex-col border-dashed bg-slate-50 p-5"
          aria-disabled="true"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h3 className="text-lg font-bold text-slate-700">Lesson from Template</h3>
            <Badge tone="neutral">Coming later</Badge>
          </div>
          <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
            Official PronounceLab templates will provide a guided lesson structure while keeping the content editable.
          </p>
          <Button type="button" variant="secondary" className="mt-5 w-full" disabled aria-disabled="true">
            Not available yet
          </Button>
        </Card>
      </div>
    </Dialog>
  );
}

export default LessonCreationDialog;
