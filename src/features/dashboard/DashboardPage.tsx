import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MainLayout from "../../shared/layouts/MainLayout";
import { useLearnerRouteIdentity } from "../auth/useLearnerRouteIdentity";
import { loadLearnerClassWorkspace, type LearnerClassWorkspace } from "../classes/learnerClassWorkspace";
import { homeEmptyState, isAssignmentUpcoming, orderHomeAssignments } from "./assignmentHome";

const emptyWorkspace: LearnerClassWorkspace = { memberships: [], assignments: [] };

export default function DashboardPage() {
  const identity = useLearnerRouteIdentity();
  const [workspace, setWorkspace] = useState(emptyWorkspace);
  const [workspaceUserId, setWorkspaceUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      if (identity.kind !== "learner") return;
      const userId = identity.session.user.id;
      setLoading(true);
      setError(false);
      void loadLearnerClassWorkspace()
        .then((result) => { if (active) { setWorkspace(result); setWorkspaceUserId(userId); } })
        .catch(() => { if (active) { setError(true); setWorkspaceUserId(userId); } })
        .finally(() => { if (active) setLoading(false); });
    });
    return () => { active = false; window.clearTimeout(timer); };
  }, [identity.kind, identity.session?.user.id]);

  const learnerUserId = identity.kind === "learner" ? identity.session.user.id : null;
  const currentWorkspace = learnerUserId !== null && workspaceUserId === learnerUserId ? workspace : emptyWorkspace;
  const currentLoading = learnerUserId !== null && (loading || workspaceUserId !== learnerUserId);
  const assignments = orderHomeAssignments(currentWorkspace.assignments);
  const upcoming = currentWorkspace.assignments.filter(isAssignmentUpcoming);
  const empty = homeEmptyState(currentWorkspace.memberships.length, assignments.length);
  return <MainLayout>
    <header>
      <p className="text-sm font-bold uppercase tracking-wide text-blue-700">Home</p>
      <h1 className="mt-1 text-3xl font-bold sm:text-4xl">Your Class learning</h1>
      <p className="mt-3 max-w-2xl text-lg text-slate-600">Continue the Courses your Teachers assigned.</p>
    </header>
    {identity.kind === "anonymous" && <section className="mt-8 rounded-2xl border bg-white p-7"><p className="text-xs font-bold uppercase tracking-wide text-blue-700">Class assignments</p><h2 className="mt-2 text-2xl font-bold">Sign in to see your Classes and assignments</h2><p className="mt-2 text-slate-600">Guest independent practice remains separate from Teacher-assigned work.</p><div className="mt-5 flex flex-col gap-3 sm:flex-row"><Link to="/login" state={{ from:"/" }} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-600 px-5 font-bold text-white">Sign in</Link><Link to="/courses" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-blue-600 px-5 font-bold text-blue-700">Explore Course Library</Link></div></section>}
    {identity.kind === "staff" && <section className="mt-8 rounded-2xl border bg-white p-7"><p className="text-xs font-bold uppercase tracking-wide text-blue-700">Staff Preview</p><h2 className="mt-2 text-2xl font-bold">Learner Home preview</h2><p className="mt-2 text-slate-600">Staff accounts do not have learner Assignments and cannot create learner progress.</p><Link to="/admin" className="mt-5 inline-flex min-h-12 items-center font-bold text-blue-700">Back to Content Studio</Link></section>}
    {identity.kind === "learner" && <section className="mt-8" aria-labelledby="continue-heading">
      <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Continue learning</p><h2 id="continue-heading" className="mt-2 text-2xl font-bold">Active Assignments</h2>
      {currentLoading && <p role="status" className="mt-4 rounded-2xl bg-white p-6">Loading Class work…</p>}
      {!currentLoading && error && <p role="alert" className="mt-4 rounded-2xl border border-red-200 bg-white p-6">Class work could not be loaded. Try again from My Classes.</p>}
      {!currentLoading && !error && assignments.length > 0 && <div className="mt-4 grid gap-4 lg:grid-cols-2">{assignments.slice(0, 4).map((item, index) => <article key={`${item.classId}:${item.assignmentId}`} className={`rounded-2xl border bg-white p-6 shadow-sm ${index === 0 ? "border-blue-300 ring-2 ring-blue-100" : "border-slate-200"}`}><p className="text-xs font-bold uppercase tracking-wide text-blue-700">{index === 0 ? "Continue Assignment" : "Assignment"}</p><h3 className="mt-1 text-2xl font-bold">{item.courseTitle}</h3><p className="mt-1 text-slate-600">{item.className} · Teacher-assigned</p><p className="mt-4 font-semibold">Class Progress: {item.navigation.completed} of {item.navigation.total} Lessons · {item.navigation.percent}%</p><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-label={`${item.courseTitle} Class Progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={item.navigation.percent}><div className="h-full rounded-full bg-blue-600" style={{ width:`${item.navigation.percent}%` }} /></div><Link to={`/releases/${item.releaseId}?classId=${item.classId}`} className="mt-5 inline-flex min-h-12 items-center rounded-xl bg-blue-600 px-5 font-bold text-white">Continue Assignment</Link></article>)}</div>}
      {!currentLoading && !error && upcoming.length > 0 && <section className="mt-8" aria-labelledby="upcoming-heading"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Upcoming</p><h2 id="upcoming-heading" className="mt-2 text-xl font-bold">Scheduled Class work</h2><div className="mt-3 grid gap-3 md:grid-cols-2">{upcoming.map((item) => <article key={`${item.classId}:${item.assignmentId}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><h3 className="font-bold">{item.courseTitle}</h3><p className="mt-1 text-sm text-slate-600">{item.className} · Available later</p></article>)}</div></section>}
      {!currentLoading && !error && assignments.length === 0 && <HomeEmptyState state={empty} />}
      <nav aria-label="Learner workspace shortcuts" className="mt-6 flex flex-col gap-3 sm:flex-row"><Link to="/classes" className="font-bold text-blue-700">My Classes →</Link><Link to="/progress" className="font-bold text-slate-700">View Progress →</Link></nav>
    </section>}
  </MainLayout>;
}

function HomeEmptyState({ state }: { state: ReturnType<typeof homeEmptyState> }) {
  if (state === "no-classes") return <div className="mt-4 rounded-2xl border bg-white p-6"><h3 className="text-xl font-bold">No Classes yet</h3><p className="mt-2 text-slate-600">Your Teacher can give you a Class code.</p><div className="mt-5 flex flex-col gap-3 sm:flex-row"><Link to="/classes#join-class" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-600 px-5 font-bold text-white">Join a Class</Link><Link to="/courses" className="inline-flex min-h-12 items-center justify-center rounded-xl border px-5 font-bold">Explore Course Library</Link></div></div>;
  if (state === "no-assignments") return <div className="mt-4 rounded-2xl border bg-white p-6"><h3 className="text-xl font-bold">You’re all caught up</h3><p className="mt-2 text-slate-600">Your Classes do not have active Course assignments right now.</p><Link to="/classes" className="mt-5 inline-flex min-h-12 items-center font-bold text-blue-700">View My Classes</Link></div>;
  return <div className="mt-4 rounded-2xl border bg-white p-6"><h3 className="text-xl font-bold">Class work complete</h3><p className="mt-2 text-slate-600">You completed every active Assignment. Review completed work in My Classes.</p><Link to="/classes" className="mt-5 inline-flex min-h-12 items-center font-bold text-blue-700">Review My Classes</Link></div>;
}
