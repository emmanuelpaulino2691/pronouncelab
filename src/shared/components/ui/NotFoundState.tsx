type Props = {
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
};

function NotFoundState({
  title,
  message,
  actionLabel,
  onAction,
}: Props) {
  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-3xl font-bold text-slate-900">
        {title}
      </h1>

      <p className="mt-3 text-slate-600">
        {message}
      </p>

      <button
        type="button"
        onClick={onAction}
        className="mt-6 rounded-lg bg-blue-600 px-5 py-2 text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        {actionLabel}
      </button>
    </div>
  );
}

export default NotFoundState;
