type Props = {
  title: string;
  completed: boolean;
};

function RecentUnitCard({
  title,
  completed,
}: Props) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">

        <p className="font-medium">
          {title}
        </p>

        <span className="text-2xl">
          {completed ? "✅" : "▶️"}
        </span>

      </div>
    </div>
  );
}

export default RecentUnitCard;