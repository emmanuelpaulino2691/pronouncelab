type Props = {
  current: number;
  total: number;
  completed?: number[];
  onPrevious: () => void;
  onNext: () => void;
};

function LessonNavigator({
current,
total,
completed = [],
onPrevious,
onNext,
}: Props) {

console.log("Navigator:", {
  current,
  completed,
});
  return (
    <div className="space-y-4">

      <div className="flex justify-center gap-2">
        {Array.from({ length: total }).map((_, index) => (
          <div
            key={index}
            className={`h-3 w-3 rounded-full ${
  completed.includes(index)
    ? "bg-green-500"
    : index === current
    ? "bg-blue-500"
    : "bg-slate-300"
}`}
          />
        ))}
      </div>

      <div className="flex items-center justify-between">

        <button
          onClick={onPrevious}
          disabled={current === 0}
          className="rounded bg-slate-200 px-4 py-2 disabled:opacity-50"
        >
          Previous
        </button>

        <div className="text-center">
          <p className="font-medium">
            Activity {current + 1} / {total}
          </p>

          <p className="text-sm text-slate-500">
            Completed {completed.length}/{total}
          </p>
        </div>

        <button
          onClick={onNext}
          disabled={false}
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          Next
        </button>

      </div>

    </div>
  );
}

export default LessonNavigator;