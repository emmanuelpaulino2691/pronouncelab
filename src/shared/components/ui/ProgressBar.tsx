type ProgressBarProps = { value: number; label?: string };

export default function ProgressBar({ value, label = "Lesson progress" }: ProgressBarProps) {
  const safeValue = Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
  return <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={safeValue} className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
    <div className="h-full rounded-full bg-blue-600 transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${safeValue}%` }} />
  </div>;
}
