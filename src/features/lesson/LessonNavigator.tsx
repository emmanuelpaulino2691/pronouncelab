type Props = {
  current: number;
  total: number;
  completed: number[];
  canAdvance: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

function LessonNavigator({
  current,
  total,
  completed,
  canAdvance,
  onPrevious,
  onNext,
}: Props) {

  const isFirst =
    current === 0;

  const isLast =
    current === total - 1;

  const completedCurrent =
    completed.includes(current);

  return (

    <div className="rounded-xl border bg-white p-5 shadow-sm">

      <div className="mb-5 flex justify-center gap-3">

        {Array.from({
          length: total,
        }).map((_, index) => (

          <div
            key={index}
            className={[
              "h-3 w-3 rounded-full transition-all",

              completed.includes(index)
                ? "bg-green-500"

                : index === current
                ? "scale-125 bg-blue-600"

                : "bg-slate-300",

            ].join(" ")}
          />

        ))}

      </div>

      <div className="flex items-center justify-between">

        <button
          type="button"
          onClick={onPrevious}
          disabled={isFirst}
          className="rounded-lg bg-slate-200 px-5 py-2 transition hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← Previous
        </button>

        <div className="text-center">

          <p className="font-semibold">
            Activity {current + 1} of {total}
          </p>

          <p
            className={
              completedCurrent
                ? "text-sm font-medium text-green-600"
                : "text-sm text-slate-500"
            }
          >
            {completedCurrent
              ? "✓ Completed"
              : "In Progress"}
          </p>

        </div>

        <button
          type="button"
          onClick={onNext}
          disabled={isLast || !canAdvance}
          className="rounded-lg bg-blue-600 px-5 py-2 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next →
        </button>

      </div>

    </div>

  );
}

export default LessonNavigator;
