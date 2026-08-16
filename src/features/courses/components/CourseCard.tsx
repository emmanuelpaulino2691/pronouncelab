import { Link } from "react-router-dom";
import ProgressBar from "../../../shared/components/ui/ProgressBar";
import { learnerJourneyActionLabel, learnerJourneyStateLabel, type LearnerCourseJourney } from "../../learner-journey/learnerJourney";

type Props = { journey: LearnerCourseJourney; recommended: boolean;assignments?:readonly{classId:number;className:string;releaseId:number}[] };

export default function CourseCard({ journey, recommended,assignments=[] }: Props) {
  const { course } = journey;
  return <article className={`rounded-2xl border bg-white p-5 shadow-sm sm:p-6 ${recommended ? "border-blue-300 ring-2 ring-blue-100" : "border-slate-200"}`}>
    {recommended && <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">{journey.state === "in_progress" ? "Continue your journey" : journey.state === "completed" ? "Ready to review" : "Recommended next"}</p>}
    <h2 className={`${recommended ? "mt-2 text-2xl" : "text-xl"} break-words font-bold text-slate-950`}>{course.title}</h2>
    <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">Independent Practice</p>
    {assignments.length>0&&<div className="mt-3 rounded-xl bg-blue-50 p-3 text-sm text-blue-900"><p className="font-semibold">Also assigned in {assignments.map(item=>item.className).join(", ")}</p><Link to={`/releases/${assignments[0].releaseId}?classId=${assignments[0].classId}`} className="mt-2 inline-flex min-h-11 items-center font-bold text-blue-800 underline">Go to Assignment</Link></div>}
    {course.description.trim() && <p className="mt-2 line-clamp-3 leading-6 text-slate-600">{course.description}</p>}
    {journey.state === "empty" ? <p className="mt-5 font-medium text-slate-600">This course does not have lessons available yet.</p> : <>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600"><span>{journey.completedLessons} of {journey.totalLessons} lessons completed</span><span className="font-semibold text-slate-700">{learnerJourneyStateLabel(journey.state)}</span></div>
      <div className="mt-3"><ProgressBar value={journey.percent} label={`${course.title} progress`} /></div>
      <Link to={`/courses/${course.id}`} className={`mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl px-5 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:w-auto ${assignments.length===0&&recommended ? "bg-blue-600 text-white hover:bg-blue-700" : "border border-blue-600 text-blue-700 hover:bg-blue-50"}`}>{assignments.length?"Practice independently":learnerJourneyActionLabel(journey.action!, "course")}</Link>
    </>}
  </article>;
}
