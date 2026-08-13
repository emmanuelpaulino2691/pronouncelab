import { Link } from "react-router-dom";
import ProgressBar from "../../../shared/components/ui/ProgressBar";
import { learnerJourneyActionLabel, learnerJourneyStateLabel, type LearnerUnitJourney } from "../../learner-journey/learnerJourney";

type Props = { journey: LearnerUnitJourney; recommended: boolean };

export default function UnitJourneyCard({ journey, recommended }: Props) {
  const { unit } = journey;
  return <article aria-label={`${unit.title}: ${journey.locked ? "Locked" : journey.current ? "Current" : learnerJourneyStateLabel(journey.state)}`} className={`rounded-2xl border p-5 shadow-sm sm:p-6 ${journey.locked ? "border-slate-200 bg-slate-100" : "bg-white"} ${recommended ? "border-blue-300 ring-2 ring-blue-100" : "border-slate-200"}`}>
    {recommended && <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">{journey.state === "completed" ? "Ready to review" : "Recommended next"}</p>}
    <h3 className={`${recommended ? "mt-2 text-2xl" : "text-xl"} break-words font-bold text-slate-950`}>{unit.title}</h3>
    {unit.description.trim() && <p className="mt-2 leading-6 text-slate-600">{unit.description}</p>}
    {journey.state === "empty" ? <p className="mt-5 font-medium text-slate-600">No lessons are available in this unit yet.</p> : <>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600"><span>{journey.completedLessons} of {journey.totalLessons} lessons completed</span><span className="font-semibold text-slate-700">{journey.locked ? "Locked" : journey.current ? "Current" : learnerJourneyStateLabel(journey.state)}</span></div>
      <div className="mt-3"><ProgressBar value={journey.percent} label={`${unit.title} progress`} /></div>
      {journey.action && <Link to={`/units/${unit.id}`} className={`mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl px-5 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:w-auto ${recommended ? "bg-blue-600 text-white hover:bg-blue-700" : "border border-blue-600 text-blue-700 hover:bg-blue-50"}`}>{learnerJourneyActionLabel(journey.action, "unit")}</Link>}
    </>}
  </article>;
}
