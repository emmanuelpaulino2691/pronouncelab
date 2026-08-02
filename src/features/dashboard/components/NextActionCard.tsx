import { useNavigate } from "react-router-dom";
import ProgressBar from "../../../shared/components/ui/ProgressBar";
import { getMissionPresentation, nextActionLabel, type NextLearnerAction } from "../learnerDashboard";

type Props = { action: NextLearnerAction; returningLearner: boolean; everythingCompleted: boolean };

export default function NextActionCard({ action, returningLearner, everythingCompleted }: Props) {
  const navigate = useNavigate();
  const activityNumber = action.activityIndex + 1;
  const presentation = getMissionPresentation(action, returningLearner, everythingCompleted);
  return <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-white to-blue-50 p-5 shadow-md sm:p-7">
    <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Today&apos;s Mission</p>
    <p className="mt-3 text-base font-semibold text-blue-800">{presentation.introduction}</p>
    <h2 className="mt-2 break-words text-2xl font-bold text-slate-950 sm:text-3xl">{presentation.heading}</h2>
    {everythingCompleted && <p className="mt-2 text-lg font-semibold text-slate-800">{action.lesson.title}</p>}
    <p className="mt-2 text-sm font-medium text-slate-600">{action.course.title} &middot; {action.unit.title}</p>
    <div className="mt-5"><div className="mb-2 flex flex-wrap justify-between gap-2 text-sm text-slate-600"><span>{action.kind === "continue" ? `Activity ${activityNumber} of ${action.lesson.activityCount}` : `${action.lesson.activityCount} activities`}</span><span>{action.completedActivities} completed</span></div><ProgressBar value={action.lessonProgress} label={`${action.lesson.title} progress`} /></div>
    <button type="button" onClick={() => navigate(action.href)} className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-6 font-bold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:w-auto">{nextActionLabel(action.kind)} <span aria-hidden="true">&rarr;</span></button>
  </div>;
}
