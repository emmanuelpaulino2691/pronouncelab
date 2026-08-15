import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  assignClassCourseRelease, deactivateClassCourseAssignment, getClassAssignmentProgress,
  getOwnedClass, getRoster, listAssignableCourseReleases, listClassCourseAssignments,
  regenerateJoinCode, setEnrollmentActive, updateClass,
  type AssignmentProgress, type ClassCourseAssignment, type ClassRecord,
  type CourseReleaseOption, type RosterMember,
} from "../../classes/classService";
import {
  assignmentCompletionSummary, assignmentDate, assignmentDeactivationConfirmation,
  assignmentStatusLabel, classArchiveConfirmation, joinCodeRegenerationConfirmation,
  newerReleaseNumber, orderAssignmentHistory,
} from "../../classes/assignmentPresentation";
import { Button, Card, PageHeader, TextArea, TextInput } from "../ui";

export function ClassWorkspaceLayout() {
  const id = Number(useParams().classId);
  const [item, setItem] = useState<ClassRecord | null>(null);
  const [roster, setRoster] = useState<RosterMember[]>([]);
  const [assignments, setAssignments] = useState<ClassCourseAssignment[]>([]);
  const [options, setOptions] = useState<CourseReleaseOption[]>([]);
  const [selected, setSelected] = useState("");
  const [reports, setReports] = useState<Record<number, AssignmentProgress>>({});
  const [reviewingUpdate, setReviewingUpdate] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [currentClass, currentRoster, currentAssignments, releaseOptions] = await Promise.all([
      getOwnedClass(id), getRoster(id), listClassCourseAssignments(id), listAssignableCourseReleases(),
    ]);
    setItem(currentClass);
    setRoster(currentRoster);
    setAssignments(currentAssignments);
    setOptions(releaseOptions);
    const activeReports = await Promise.all(currentAssignments.filter((row) => row.status === "active").map(async (row) => [row.assignmentId, await getClassAssignmentProgress(row.assignmentId)] as const));
    setReports(Object.fromEntries(activeReports));
  }, [id]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load().catch(() => setMessage("Class could not be loaded.")); });
    return () => window.clearTimeout(timer);
  }, [load]);

  const active = useMemo(() => assignments.filter((row) => row.status === "active"), [assignments]);
  const history = useMemo(() => orderAssignmentHistory(assignments), [assignments]);

  if (!item) return <p role="status">{message ?? "Loading Class…"}</p>;

  async function changeClassStatus() {
    const archiving = item?.status === "active";
    if (archiving && !window.confirm(classArchiveConfirmation)) return;
    await updateClass(id, item!.name, item!.description, archiving ? "archived" : "active");
    setMessage(archiving ? "Class archived. Learning history was preserved." : "Class reactivated.");
    await load();
  }

  async function copyJoinCode() {
    try { await navigator.clipboard.writeText(item!.join_code); setMessage("Join code copied."); }
    catch { setMessage("The join code could not be copied. Select it manually."); }
  }

  return <section className="mx-auto max-w-6xl space-y-6">
    <PageHeader eyebrow="Teacher Workspace" title={item.name} breadcrumbs={[{ label:"My Classes",to:"/admin/classes" },{ label:item.name }]} actions={<Link to="/admin/classes" className="font-semibold text-blue-700">Back</Link>} />
    {message && <p role="status" className="rounded-xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-900">{message}</p>}

    <Card className="space-y-4 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-bold">Class settings</h2><p className="mt-1 text-sm text-slate-600">{item.status === "active" ? "Active learners can join and open assigned Courses." : "Archived — joining and Class-derived Course access are paused."}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${item.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}`}>{item.status}</span></div>
      <TextInput aria-label="Class name" value={item.name} onChange={(event) => setItem({ ...item,name:event.target.value })} />
      <TextArea aria-label="Class description" value={item.description} onChange={(event) => setItem({ ...item,description:event.target.value })} />
      <div className="flex flex-col gap-3 sm:flex-row"><Button onClick={() => void updateClass(id,item.name,item.description,item.status).then(load)}>Save changes</Button><Button variant="secondary" onClick={() => void changeClassStatus()}>{item.status === "active" ? "Archive Class" : "Reactivate Class"}</Button></div>
    </Card>

    <Card className="p-6">
      <div><h2 className="text-xl font-bold">Assigned Courses</h2><p className="mt-1 text-sm text-slate-600">Assignments stay pinned to the selected published Release until you explicitly update them.</p></div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <select aria-label="Course Release" className="min-h-12 min-w-0 flex-1 rounded-xl border px-4" value={selected} onChange={(event) => setSelected(event.target.value)}><option value="">Choose a published Course</option>{options.map((option) => <option key={option.releaseId} value={option.releaseId}>{option.courseTitle} — Release {option.releaseNumber}{option.isLatest ? " (latest)" : ""}</option>)}</select>
        <Button disabled={!selected || item.status === "archived"} onClick={() => void assignClassCourseRelease(id,Number(selected)).then(() => { setSelected(""); setMessage("Course assigned."); return load(); })}>Assign Course</Button>
      </div>

      <div className="mt-6 space-y-5">{active.map((assignment) => {
        const report = reports[assignment.assignmentId];
        const newer = newerReleaseNumber(assignment);
        const update = newer ? options.find((option) => option.courseId === assignment.courseId && option.releaseNumber === newer) : undefined;
        return <article key={assignment.assignmentId} className="rounded-2xl border border-slate-200 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-bold">{assignment.courseTitle}</h3><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">Active</span></div><p className="mt-1 text-sm text-slate-600">Release {assignment.releaseNumber} · Assigned {assignmentDate(assignment.assignedAt)}</p><p className="mt-2 text-sm font-semibold text-slate-800">{assignmentCompletionSummary(report)}</p></div>
            <div className="flex flex-col gap-2 sm:flex-row"><Button variant="secondary" onClick={() => setReviewingUpdate(reviewingUpdate === assignment.assignmentId ? null : assignment.assignmentId)} disabled={!newer}>{newer ? "Review update" : "Latest Release"}</Button><Button variant="secondary" onClick={() => { if (window.confirm(assignmentDeactivationConfirmation)) void deactivateClassCourseAssignment(assignment.assignmentId).then(() => { setMessage("Assignment removed. Learner progress was preserved."); return load(); }); }}>Remove assignment</Button></div>
          </div>
          {newer && <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">A newer published version—Release {newer}—is available. Learners stay on Release {assignment.releaseNumber} until you confirm an update.</p>}
          {reviewingUpdate === assignment.assignmentId && update && <section aria-label={`Update ${assignment.courseTitle}`} className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4"><h4 className="font-bold text-blue-950">Review Course update</h4><div className="mt-3 grid gap-3 sm:grid-cols-2"><div className="rounded-lg bg-white p-3"><p className="text-xs font-bold uppercase text-slate-500">Currently assigned</p><p className="mt-1 font-semibold">Release {assignment.releaseNumber}</p></div><div className="rounded-lg bg-white p-3"><p className="text-xs font-bold uppercase text-slate-500">Available update</p><p className="mt-1 font-semibold">Release {update.releaseNumber}</p></div></div><p className="mt-3 text-sm text-blue-900">Updating starts learners on independent progress for the new immutable Release. Existing Release progress and assignment history remain preserved.</p><div className="mt-4 flex flex-col gap-2 sm:flex-row"><Button onClick={() => void assignClassCourseRelease(id,update.releaseId).then(() => { setReviewingUpdate(null); setMessage(`Class updated to Release ${update.releaseNumber}.`); return load(); })}>Confirm update</Button><Button variant="secondary" onClick={() => setReviewingUpdate(null)}>Cancel</Button></div></section>}
          {report && <div className="mt-5"><h4 className="text-sm font-bold uppercase tracking-wide text-slate-500">Learner progress</h4><div className="mt-3 overflow-hidden rounded-xl border">{report.learners.map((learner) => <div key={learner.learnerId} className="grid gap-2 border-b p-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"><div><p className="break-all font-semibold">{learner.email}</p><p className="text-xs text-slate-500">Last active {assignmentDate(learner.lastAccessedAt)}</p></div><p className="text-sm font-semibold">{learner.completedLessons} / {report.totalLessons} Lessons</p><span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-800">{learner.completionPercent}% · {assignmentStatusLabel(learner.completedLessons >= report.totalLessons && report.totalLessons > 0 ? "completed" : learner.startedLessons > 0 ? "in-progress" : "not-started")}</span></div>)}{report.learners.length === 0 && <p className="p-4 text-sm text-slate-600">No active learners.</p>}</div></div>}
        </article>;
      })}{active.length === 0 && <p className="rounded-xl border border-dashed p-5 text-slate-600">No active Course assignments.</p>}</div>

      {history.length > 0 && <details className="mt-7 border-t pt-5"><summary className="cursor-pointer font-bold text-slate-900">Assignment history ({history.length})</summary><ol className="mt-4 space-y-3">{history.map((assignment) => <li key={assignment.assignmentId} className="flex flex-col gap-2 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{assignment.courseTitle} — Release {assignment.releaseNumber}</p><p className="text-sm text-slate-600">Assigned {assignmentDate(assignment.assignedAt)}{assignment.endedAt ? ` · Ended ${assignmentDate(assignment.endedAt)}` : ""}</p></div><span className={`w-fit rounded-full px-3 py-1 text-xs font-bold uppercase ${assignment.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}`}>{assignment.status}</span></li>)}</ol></details>}
    </Card>

    <Card className="p-6"><h2 className="text-xl font-bold">Invite learners</h2><p className="mt-1 text-sm text-slate-600">Share this code with learners you want to join this Class.</p><div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center"><code className="min-w-0 flex-1 select-all rounded-xl bg-slate-100 px-4 py-3 text-xl font-bold tracking-wider">{item.join_code_enabled ? item.join_code : "Code disabled"}</code><Button variant="secondary" disabled={!item.join_code_enabled} onClick={() => void copyJoinCode()}>Copy code</Button></div><p className="mt-3 text-sm text-slate-600">Creating a new code revokes only the old code. Existing learners remain enrolled.</p><Button className="mt-4" variant="secondary" disabled={item.status === "archived"} onClick={() => { if (window.confirm(joinCodeRegenerationConfirmation)) void regenerateJoinCode(id).then(() => { setMessage("A new join code is ready. The old code no longer works."); return load(); }); }}>Create new join code</Button></Card>

    <Card className="p-6"><h2 className="text-xl font-bold">Learners</h2><p className="mt-1 text-sm text-slate-600">Removing access preserves the learner’s progress and enrollment history.</p><div className="mt-4 space-y-3">{roster.map((member) => <div key={member.learnerId} className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="break-all font-semibold">{member.email}</p><p className="text-sm capitalize text-slate-600">{member.status}</p></div><Button variant="secondary" onClick={() => void setEnrollmentActive(id,member.learnerId,member.status !== "active").then(load)}>{member.status === "active" ? "Remove access" : "Reactivate learner"}</Button></div>)}{roster.length === 0 && <p className="text-slate-600">No learners enrolled.</p>}</div></Card>
  </section>;
}
