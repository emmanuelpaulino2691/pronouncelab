import Card from "./Card";

type StatCardProps = {
  title: string;
  value: string;
  color?: string;
};

function StatCard({
  title,
  value,
  color = "text-slate-900",
}: StatCardProps) {
  return (
    <Card title={title}>
      <p className={`text-5xl font-bold ${color}`}>
        {value}
      </p>
    </Card>
  );
}

export default StatCard;