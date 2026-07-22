import { emojiCatalog } from "./emojiCatalog";

type EmojiSelectorProps = {
  value: string;
  onChange: (emoji: string) => void;
  disabled?: boolean;
};

export function EmojiSelector({
  value,
  onChange,
  disabled = false,
}: EmojiSelectorProps) {
  const customEmoji =
    value && !emojiCatalog.some((entry) => entry.emoji === value)
      ? { emoji: value, label: "Current custom emoji" }
      : null;
  const entries = customEmoji ? [customEmoji, ...emojiCatalog] : emojiCatalog;

  return (
    <fieldset disabled={disabled}>
      <legend className="text-sm font-semibold text-slate-800">Course emoji</legend>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        Choose a visual marker that helps teachers recognize this course.
      </p>
      <div className="mt-3 grid grid-cols-5 gap-2 min-[360px]:grid-cols-6 sm:grid-cols-9">
        {entries.map((entry) => {
          const selected = entry.emoji === value;
          return (
            <button
              key={`${entry.label}-${entry.emoji}`}
              type="button"
              aria-label={`${entry.label}${selected ? ", selected" : ""}`}
              aria-pressed={selected}
              title={entry.label}
              onClick={() => onChange(entry.emoji)}
              className={`admin-focus relative grid min-h-11 min-w-11 place-items-center rounded-xl border text-xl transition ${
                selected
                  ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
                  : "border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50"
              }`}
            >
              <span aria-hidden="true">{entry.emoji}</span>
              {selected && <span aria-hidden="true" className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-blue-700 text-[11px] font-bold text-white">✓</span>}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
