type Props = {
  current: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
};

function LessonNavigator({
  current,
  total,
  onPrevious,
  onNext,
}: Props) {
  return (
    <div className="flex items-center justify-between">
      <button
        onClick={onPrevious}
        disabled={current === 0}
        className="rounded bg-slate-200 px-4 py-2 disabled:opacity-50"
      >
        Previous
      </button>

      <span className="font-medium">
        {current + 1} / {total}
      </span>

      <button
        onClick={onNext}
        disabled={current === total - 1}
        className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}

export default LessonNavigator;