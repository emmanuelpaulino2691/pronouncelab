type Props = {
  current: number; total: number; canAdvance: boolean; isLast: boolean;
  onPrevious: () => void; onComplete: () => void;
};

export default function LessonNavigator({ current, total, canAdvance, isLast, onPrevious, onComplete }: Props) {
  return <nav aria-label="Lesson controls" className="sticky bottom-0 z-20 -mx-4 border-t border-slate-200 bg-white/95 px-4 py-4 shadow-[0_-8px_25px_rgb(15_23_42/0.06)] backdrop-blur sm:static sm:mx-0 sm:rounded-2xl sm:border sm:p-4 sm:shadow-sm">
    <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
      <button type="button" onClick={onPrevious} disabled={current === 0} className="min-h-12 rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
      <p className="hidden text-sm text-slate-500 sm:block">{current + 1} of {total}</p>
      <button type="button" onClick={onComplete} disabled={!canAdvance} className="min-h-12 flex-1 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none">{isLast ? "Complete Lesson" : "Complete Activity"}</button>
    </div>
  </nav>;
}
