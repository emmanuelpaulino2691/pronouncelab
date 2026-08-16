import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MainLayout from "../../shared/layouts/MainLayout";
import { useLearnerRouteIdentity } from "../auth/useLearnerRouteIdentity";
import { assignmentContinuePresentation, resolveReleaseNavigation, type ReleaseNavigation } from "../releases/releaseNavigation";
import { getReleaseManifest, getReleaseProgress } from "../releases/releaseService";
import { assignmentCourseStatus, assignmentStatusLabel } from "./assignmentPresentation";
import { joinClass, listClassCourseAssignments, listMyMemberships, type ClassCourseAssignment, type EnrollmentRecord } from "./classService";

type AssignmentView = ClassCourseAssignment & { navigation:ReleaseNavigation };

export default function LearnerClassesPage() {
  const identity = useLearnerRouteIdentity();
  const [items, setItems] = useState<EnrollmentRecord[]>([]);
  const [assignments, setAssignments] = useState<Record<number, AssignmentView[]>>({});
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const memberships = await listMyMemberships();
    setItems(memberships);
    setAssignments(Object.fromEntries(await Promise.all(memberships.map(async (membership) => {
      const rows = await listClassCourseAssignments(membership.class_id);
      const views = await Promise.all(rows.map(async (assignment) => {
        const [manifest, progress] = await Promise.all([getReleaseManifest(assignment.releaseId),getReleaseProgress(assignment.releaseId)]);
        return { ...assignment,navigation:resolveReleaseNavigation(manifest,progress) };
      }));
      return [membership.class_id,views];
    }))));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (identity.kind === "learner") void load().catch(() => setMessage("Classes could not be loaded."));
      else { setItems([]); setAssignments({}); }
    });
    return () => window.clearTimeout(timer);
  }, [identity.kind, load]);

  if (identity.kind === "anonymous") return <MainLayout><section className="rounded-2xl border bg-white p-7"><h1 className="text-3xl font-bold">Classes</h1><p className="mt-3 text-slate-600">Sign in with a learner account to join and view Classes.</p><Link to="/login" state={{ from:"/classes" }} className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white">Sign in</Link></section></MainLayout>;
  if (identity.kind === "staff") return <MainLayout><section className="rounded-2xl border bg-white p-7"><h1 className="text-3xl font-bold">Staff preview</h1><p className="mt-3 text-slate-600">Staff accounts cannot enroll as learners.</p><Link to="/admin/classes" className="mt-5 inline-flex font-semibold text-blue-700">Open Content Studio Classes</Link></section></MainLayout>;

  return <MainLayout><section className="mx-auto max-w-5xl space-y-7">
    <header><p className="text-sm font-bold uppercase tracking-wide text-blue-700">Learner workspace</p><h1 className="mt-1 text-3xl font-bold">Your Classes</h1><p className="mt-2 text-slate-600">See assigned Courses, progress, and what is ready to learn.</p></header>
    <form className="flex flex-col gap-3 rounded-2xl border bg-white p-5 sm:flex-row sm:items-end" onSubmit={(event) => { event.preventDefault(); setMessage(null); void joinClass(code).then(load).then(() => { setCode(""); setMessage("Class joined."); }).catch(() => setMessage("That join code is invalid or unavailable.")); }}><label className="min-w-0 flex-1 text-sm font-semibold text-slate-700">Join a Class<input aria-label="Class join code" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="Enter the code from your teacher" className="mt-2 min-h-12 w-full rounded-xl border px-4 font-mono uppercase tracking-wider" maxLength={16} required /></label><button className="min-h-12 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white">Join Class</button></form>
    {message && <p role="status" className="rounded-xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-900">{message}</p>}
    <div className="space-y-6">{items.map((membership) => <article id={`class-${membership.class_id}`} key={membership.class_id} className="scroll-mt-6 rounded-2xl border bg-white p-5 shadow-sm sm:p-6"><h2 className="text-xl font-bold">{membership.classes?.name}</h2>{membership.classes?.description && <p className="mt-2 text-sm leading-6 text-slate-600">{membership.classes.description}</p>}<h3 className="mt-6 text-sm font-bold uppercase tracking-wide text-slate-500">Assigned Courses</h3><div className="mt-3 grid gap-4 lg:grid-cols-2">{(assignments[membership.class_id] ?? []).map((assignment) => {
        const presentation = assignmentContinuePresentation(assignment.releaseId,membership.class_id,assignment.navigation);
        const status = assignmentCourseStatus(assignment.navigation.completed,assignment.navigation.total);
        return <section key={assignment.assignmentId} className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-slate-50 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wide text-blue-700">Assigned Course</p><h4 className="mt-1 break-words text-lg font-bold">{assignment.courseTitle}</h4>{assignment.courseLevel && <p className="mt-1 text-sm text-slate-500">Level {assignment.courseLevel}</p>}</div><span className={`rounded-full px-3 py-1 text-xs font-bold ${status === "completed" ? "bg-emerald-100 text-emerald-800" : status === "in-progress" ? "bg-blue-100 text-blue-800" : "bg-slate-200 text-slate-700"}`}>{assignmentStatusLabel(status)}</span></div><p className="mt-4 text-sm font-semibold text-slate-800">Class Progress · {presentation.progressLabel}</p><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200" aria-label={`${assignment.navigation.percent}% complete`}><div className="h-full rounded-full bg-blue-600" style={{ width:`${assignment.navigation.percent}%` }} /></div><Link to={presentation.href} className="mt-5 inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-center font-semibold text-white hover:bg-blue-700">{status==="completed"?"Review Assignment":"Continue Assignment"}</Link></section>;
      })}{(assignments[membership.class_id] ?? []).length === 0 && <p className="col-span-full rounded-xl border border-dashed p-5 text-sm text-slate-600">No Courses are currently assigned.</p>}</div></article>)}</div>
    {items.length === 0 && <p className="rounded-2xl border border-dashed p-7 text-slate-600">You have not joined a Class yet. Enter a code from your teacher above.</p>}
  </section></MainLayout>;
}
