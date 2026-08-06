import { Link } from "react-router-dom";
import ProgressBar from "../../../shared/components/ui/ProgressBar";
import { learnerJourneyActionLabel, learnerJourneyStateLabel, type LearnerLessonJourney } from "../../learner-journey/learnerJourney";

type Props = { journey: LearnerLessonJourney; recommended: boolean };

export default function LessonJourneyCard({ journey, recommended }: Props) {
  const { lesson } = journey;
  return <article className={`rounded-2xl border bg-white p-5 shadow-sm sm:p-6 ${recommended ? "border-blue-300 ring-2 ring-blue-100" : "border-slate-200"}`}>
    {recommended && <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">{journey.state === "completed" ? "Ready to review" : "Recommended next"}</p>}
    <h3 className={`${recommended ? "mt-2 text-2xl" : "text-xl"} break-words font-bold text-slate-950`}>{lesson.title}</h3>
    {lesson.description.trim() && <p className="mt-2 leading-6 text-slate-600">{lesson.description}</p>}
    <p className="mt-4 text-sm font-semibold text-slate-700">{journey.state === "empty" ? "No learning activities available yet" : learnerJourneyStateLabel(journey.state)}</p>
    {journey.state === "in_progress" && <div className="mt-3"><p className="mb-2 text-sm text-slate-600">Activity {journey.activityIndex + 1} of {journey.totalActivities}</p><ProgressBar value={journey.percent} label={`${lesson.title} activity progress`} /></div>}
    {journey.action && <Link to={`/lessons/${lesson.id}`} className={`mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl px-5 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:w-auto ${recommended ? "bg-blue-600 text-white hover:bg-blue-700" : "border border-blue-600 text-blue-700 hover:bg-blue-50"}`}>{learnerJourneyActionLabel(journey.action, "lesson")}</Link>}
  </article>;
}
