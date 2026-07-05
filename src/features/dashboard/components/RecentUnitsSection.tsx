import RecentUnitCard from "./RecentUnitCard";

type Unit = {
  id: number;
  title: string;
  completed: boolean;
};

type Props = {
  units: Unit[];
};

function RecentUnitsSection({ units }: Props) {
  return (
    <div className="mt-10">

      <h2 className="mb-5 text-2xl font-bold">
        Recent Units
      </h2>

      <div className="grid gap-4">

        {units.map((unit) => (
          <RecentUnitCard
            key={unit.id}
            title={unit.title}
            completed={unit.completed}
          />
        ))}

      </div>

    </div>
  );
}

export default RecentUnitsSection;