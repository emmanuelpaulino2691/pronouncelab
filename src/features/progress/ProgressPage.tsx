import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MainLayout from "../../shared/layouts/MainLayout";
import { learnerContentProvider } from "../../shared/content/learnerContentComposition";
import { useLearnerResource } from "../../shared/content/hooks/useLearnerResource";
import { useUserProgress } from "../../shared/hooks/useUserProgress";
import { useLearnerRouteIdentity } from "../auth/useLearnerRouteIdentity";
import { loadLearnerClassWorkspace, type LearnerClassWorkspace } from "../classes/learnerClassWorkspace";
import { resolveLearnerCourseState } from "../learner-journey/learnerJourney";
import { presentClassProgress, presentIndependentProgress } from "./learnerProgressPresentation";

const emptyWorkspace: LearnerClassWorkspace = { memberships: [], assignments: [] };

export default function ProgressPage() {
  const identity = useLearnerRouteIdentity();
  const { progress } = useUserProgress();
  const courses = useLearnerResource((signal) => learnerContentProvider.listCourses(signal), []);
  const [workspace, setWorkspace] = useState(emptyWorkspace);
  const [workspaceUserId, setWorkspaceUserId] = useState<string | null>(null);
  const [classLoading, setClassLoading] = useState(false);
  const [classError, setClassError] = useState(false);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      if (identity.kind !== "learner") return;
      const userId = identity.session.user.id;
      setClassLoading(true); setClassError(false);
      void loadLearnerClassWorkspace().then((result) => { if (active) { setWorkspace(result); setWorkspaceUserId(userId); } }).catch(() => { if (active) { setClassError(true); setWorkspaceUserId(userId); } }).finally(() => { if (active) setClassLoading(false); });
    });
    return () => { active = false; window.clearTimeout(timer); };
  }, [identity.kind, identity.session?.user.id]);

  if (identity.kind === "anonymous") return <MainLayout><section className="rounded-2xl border bg-white p-7"><h1 className="text-3xl font-bold">Progress</h1><p className="mt-3 text-slate-600">Sign in to see synchronized Class Progress and Independent Practice separately.</p><Link to="/login" state={{ from:"/progress" }} className="mt-5 inline-flex min-h-12 items-center rounded-xl bg-blue-600 px-5 font-bold text-white">Sign in</Link></section></MainLayout>;
  if (identity.kind === "staff") return <MainLayout><section className="rounded-2xl border bg-white p-7"><p className="text-sm font-bold uppercase text-blue-700">Staff Preview</p><h1 className="mt-2 text-3xl font-bold">Learner Progress preview</h1><p className="mt-3 text-slate-600">Staff sessions do not have learner Progress and cannot create it.</p><Link to="/admin" className="mt-5 inline-flex min-h-12 items-center font-bold text-blue-700">Back to Content Studio</Link></section></MainLayout>;

  const currentWorkspace = workspaceUserId === identity.session.user.id ? workspace : emptyWorkspace;
  const currentClassLoading = classLoading || workspaceUserId !== identity.session.user.id;
  const classItems = presentClassProgress(currentWorkspace.assignments);
  const independentItems = presentIndependentProgress((courses.value ?? []).map((course) => resolveLearnerCourseState(course, progress)));
  return <MainLayout><header><p className="text-sm font-bold uppercase tracking-wide text-blue-700">Progress</p><h1 className="mt-1 text-3xl font-bold sm:text-4xl">How you’re doing</h1><p className="mt-2 max-w-2xl text-slate-600">Class Progress and Independent Practice are tracked separately.</p></header>
    <section aria-labelledby="class-progress-heading" className="mt-8"><h2 id="class-progress-heading" className="text-2xl font-bold">Class Progress</h2><p className="mt-1 text-slate-600">Progress in Courses assigned by your Teachers.</p>{currentClassLoading && <p role="status" className="mt-4 rounded-2xl bg-white p-6">Loading Class Progress…</p>}{!currentClassLoading && classError && <p role="alert" className="mt-4 rounded-2xl border border-red-200 bg-white p-6">Class Progress could not be loaded.</p>}{!currentClassLoading && !classError && <ProgressGrid items={classItems} empty="No active Class assignments yet." />}</section>
    <section aria-labelledby="personal-progress-heading" className="mt-10"><h2 id="personal-progress-heading" className="text-2xl font-bold">Independent Practice</h2><p className="mt-1 text-slate-600">Personal Progress from Courses you chose in Course Library.</p>{courses.loading && <p role="status" className="mt-4 rounded-2xl bg-white p-6">Loading Personal Progress…</p>}{courses.error && <p role="alert" className="mt-4 rounded-2xl border border-red-200 bg-white p-6">Independent Practice progress could not be loaded.</p>}{!courses.loading && !courses.error && <ProgressGrid items={independentItems} empty="No independent practice started yet." />}</section>
  </MainLayout>;
}

function ProgressGrid({ items, empty }: { items: readonly { courseTitle:string;completed:number;total:number;percent:number;href:string;className?:string }[];empty:string }) {
  if (!items.length) return <p className="mt-4 rounded-2xl border border-dashed p-6 text-slate-600">{empty}</p>;
  return <div className="mt-4 grid gap-4 md:grid-cols-2">{items.map((item) => <article key={`${item.href}:${item.className ?? "personal"}`} className="rounded-2xl border bg-white p-5"><h3 className="text-xl font-bold">{item.courseTitle}</h3>{item.className && <p className="mt-1 text-sm text-slate-600">{item.className} · Assignment</p>}<p className="mt-4 font-semibold">{item.completed} of {item.total} Lessons · {item.percent}%</p><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-label={`${item.courseTitle} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={item.percent}><div className="h-full rounded-full bg-blue-600" style={{ width:`${item.percent}%` }} /></div><Link to={item.href} className="mt-4 inline-flex min-h-11 items-center font-bold text-blue-700">{item.className ? "Open Assignment" : item.percent === 100 ? "Review Course" : "Continue Practice"}</Link></article>)}</div>;
}
