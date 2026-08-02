import Card from "../../../shared/components/ui/Card";
import { futureMotivationItems, motivationUnavailableMessage } from "../motivationPlaceholders";

export default function UserStatsCard() {
  return <Card title="Goals and achievements"><p className="text-sm leading-6 text-slate-600">{motivationUnavailableMessage}</p><ul className="mt-4 space-y-2">{futureMotivationItems.map((item) => <li key={item} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm"><span className="font-medium text-slate-700">{item}</span><span className="text-xs font-semibold text-slate-500">Coming later</span></li>)}</ul></Card>;
}
