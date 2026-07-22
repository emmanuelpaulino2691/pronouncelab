import {
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";

import {
  Alert,
  Button,
  Dialog,
  FormField,
  TextArea,
  TextInput,
  shouldProceedWithClose,
} from "../ui";

export type HierarchyItemInput = {
  title: string;
  description: string;
  position: number;
};

type HierarchyItemFormProps = {
  itemType: "unit" | "lesson";
  item: HierarchyItemInput | null;
  nextPosition: number;
  isSaving: boolean;
  errorMessage?: string | null;
  onCancel: () => void;
  onBack?: () => void;
  onSubmit: (input: HierarchyItemInput) => void;
};

function inputsMatch(first: HierarchyItemInput, second: HierarchyItemInput) {
  return first.title === second.title &&
    first.description === second.description &&
    first.position === second.position;
}

function HierarchyItemForm({
  itemType,
  item,
  nextPosition,
  isSaving,
  errorMessage,
  onCancel,
  onBack,
  onSubmit,
}: HierarchyItemFormProps) {
  const formId = useId();
  const titleRef = useRef<HTMLInputElement>(null);
  const [initialInput] = useState<HierarchyItemInput>(() =>
    item ?? { title: "", description: "", position: nextPosition }
  );
  const [input, setInput] = useState(initialInput);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const displayType = itemType === "unit" ? "Unit" : "Lesson";
  const titleError = input.title.trim() ? "" : `Add a ${itemType} title.`;
  const showTitleError = Boolean(attemptedSubmit && titleError);
  const isDirty = !inputsMatch(input, initialInput);

  function mayLeave() {
    return shouldProceedWithClose(
      { hasUnsavedChanges: isDirty },
      () => window.confirm(`Discard your unsaved ${itemType} changes?`)
    );
  }

  function requestClose() {
    if (mayLeave()) onCancel();
  }

  function requestBack() {
    if (onBack && mayLeave()) onBack();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttemptedSubmit(true);
    if (isSaving || titleError) return;
    onSubmit({
      title: input.title.trim(),
      description: input.description.trim(),
      position: input.position,
    });
  }

  return (
    <Dialog
      isOpen
      onClose={requestClose}
      preventClose={isSaving}
      initialFocusRef={titleRef}
      title={item ? `Edit ${item.title}` : `Create a ${itemType}`}
      description={item ? `Update this draft ${itemType}.` : `Add the basic details for this draft ${itemType}.`}
      footer={<>
        {onBack && <Button type="button" variant="ghost" onClick={requestBack} disabled={isSaving}>Back to choices</Button>}
        <Button type="button" variant="secondary" onClick={requestClose} disabled={isSaving}>Cancel</Button>
        <Button type="submit" form={formId} isLoading={isSaving} disabled={isSaving}>
          {isSaving ? "Saving…" : item ? `Save ${itemType} changes` : `Create draft ${itemType}`}
        </Button>
      </>}
      className="max-w-xl"
    >
      <form id={formId} className="space-y-5" onSubmit={handleSubmit} noValidate>
        {errorMessage && <Alert tone="error">{errorMessage}</Alert>}
        <FormField
          label={`${displayType} title`}
          htmlFor={`${formId}-title`}
          required
          error={showTitleError ? titleError : undefined}
        >
          <TextInput
            ref={titleRef}
            id={`${formId}-title`}
            required
            value={input.title}
            onChange={(event) => setInput((current) => ({ ...current, title: event.target.value }))}
            aria-invalid={showTitleError}
            aria-describedby={showTitleError ? `${formId}-title-error` : undefined}
            placeholder={`${displayType} title`}
          />
        </FormField>
        <FormField label="Description (optional)" htmlFor={`${formId}-description`} hint={`Briefly explain the purpose of this ${itemType}.`}>
          <TextArea
            id={`${formId}-description`}
            aria-describedby={`${formId}-description-hint`}
            value={input.description}
            onChange={(event) => setInput((current) => ({ ...current, description: event.target.value }))}
            placeholder={`Describe this ${itemType}.`}
          />
        </FormField>
        <FormField label="Position" htmlFor={`${formId}-position`} hint={`Choose where this ${itemType} appears in the learning order.`} required>
          <TextInput
            id={`${formId}-position`}
            aria-describedby={`${formId}-position-hint`}
            required
            type="number"
            min={0}
            value={input.position}
            onChange={(event) => setInput((current) => ({ ...current, position: Number(event.target.value) }))}
          />
        </FormField>
      </form>
    </Dialog>
  );
}

export default HierarchyItemForm;
