type ProgressBarProps = {
  value: number;
};

function ProgressBar({
  value,
}: ProgressBarProps) {
  return (
    <div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden">

      <div
        className="h-full rounded-full bg-blue-600 transition-all duration-500"
        style={{
          width: `${value}%`,
        }}
      />

    </div>
  );
}

export default ProgressBar;
