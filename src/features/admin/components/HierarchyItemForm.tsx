import {
  useState,
  type FormEvent,
} from "react";

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
  onCancel: () => void;
  onSubmit: (input: HierarchyItemInput) => void;
};

function HierarchyItemForm({
  itemType,
  item,
  nextPosition,
  isSaving,
  onCancel,
  onSubmit,
}: HierarchyItemFormProps) {
  const [input, setInput] =
    useState<HierarchyItemInput>(() =>
      item ?? {
        title: "",
        description: "",
        position: nextPosition,
      }
    );
  const titleId = `${itemType}-form-title`;
  const displayType =
    itemType === "unit" ? "Unit" : "Lesson";
  const fieldClass =
    "mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    onSubmit({
      title: input.title.trim(),
      description: input.description.trim(),
      position: input.position,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/60 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCancel();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="my-6 w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
      >
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
              {item
                ? `Edit draft ${itemType}`
                : `New ${itemType}`}
            </p>
            <h2
              id={titleId}
              className="mt-2 text-2xl font-bold text-slate-950"
            >
              {item
                ? `Edit ${item.title}`
                : `Create a ${itemType}`}
            </h2>
          </div>

          <button
            type="button"
            onClick={onCancel}
            aria-label={`Close ${itemType} form`}
            className="rounded-lg px-3 py-2 text-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            ×
          </button>
        </div>

        <form
          className="mt-7 space-y-5"
          onSubmit={handleSubmit}
        >
          <label className="block text-sm font-semibold text-slate-700">
            Title
            <input
              required
              autoFocus
              value={input.title}
              onChange={(event) =>
                setInput((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              className={fieldClass}
              placeholder={`${displayType} title`}
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Description
            <textarea
              value={input.description}
              onChange={(event) =>
                setInput((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              className={`${fieldClass} min-h-28 resize-y`}
              placeholder={`Describe this ${itemType}.`}
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Position
            <input
              required
              type="number"
              min={0}
              value={input.position}
              onChange={(event) =>
                setInput((current) => ({
                  ...current,
                  position: Number(
                    event.target.value
                  ),
                }))
              }
              className={fieldClass}
            />
          </label>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className="rounded-xl border border-slate-300 px-5 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving
                ? "Saving…"
                : item
                  ? "Save changes"
                  : "Create draft"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default HierarchyItemForm;
