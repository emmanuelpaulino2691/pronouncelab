import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import MainLayout from "../../shared/layouts/MainLayout";
import { useLearnerRouteIdentity } from "../auth/useLearnerRouteIdentity";
import { listMyMemberships } from "./classService";
import { listClassAnnouncements, markAllClassAnnouncementsRead, markClassAnnouncementRead, type ClassAnnouncement } from "./classAnnouncementService";

export default function ClassAnnouncementsPage() {
  const classId = Number(useParams().classId);
  const identity = useLearnerRouteIdentity();
  const [rows, setRows] = useState<ClassAnnouncement[]>([]);
  const [className, setClassName] = useState("Class");
  const [error, setError] = useState(false);
  useEffect(() => { if (identity.kind !== "learner") return; void Promise.all([listClassAnnouncements(classId), listMyMemberships()]).then(([items, memberships]) => { setRows(items); setClassName(memberships.find(item => item.class_id === classId)?.classes?.name ?? "Class"); }).catch(() => setError(true)); }, [classId, identity.kind]);
  if (identity.kind !== "learner") return <MainLayout><p className="rounded-xl border bg-white p-6">Staff accounts cannot access learner announcement state.</p></MainLayout>;
  const isUnread = (row: ClassAnnouncement) => !row.readRevision || row.readRevision < row.revision;
  const unread = rows.filter(isUnread).length;
  return <MainLayout><section className="mx-auto max-w-3xl space-y-6"><header><p className="text-sm font-bold uppercase tracking-wide text-blue-700">Class Announcements</p><h1 className="mt-1 text-3xl font-bold">{className}</h1><p className="mt-2 text-slate-600">Messages from your Teacher.</p><div className="mt-4 flex flex-wrap gap-3">{unread > 0 && <button type="button" onClick={() => void markAllClassAnnouncementsRead(classId).then(() => setRows(current => current.map(row => ({ ...row, readAt: new Date().toISOString(), readRevision: row.revision }))))} className="min-h-11 rounded-xl border px-4 font-semibold">Mark all as read</button>}</div></header>{error && <p role="alert" className="rounded-xl bg-red-50 p-5 text-red-900">Announcements could not be loaded.</p>}{!error && rows.length === 0 && <p className="rounded-xl border border-dashed p-6 text-slate-600">No announcements yet.</p>}<ul className="space-y-4">{rows.map(row => <li key={row.id} className={`rounded-2xl border bg-white p-5 ${isUnread(row) ? "border-blue-300 ring-1 ring-blue-100" : "border-slate-200"}`}><div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-bold">{row.title}</h2>{row.editedAt && <span className="mt-1 inline-block text-xs font-bold uppercase tracking-wide text-amber-700">Updated</span>}</div>{isUnread(row) && <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">Unread</span>}</div><p className="mt-3 whitespace-pre-wrap text-slate-700">{row.body}</p><p className="mt-3 text-xs text-slate-500">{new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(row.publishedAt))}{row.editedAt ? " · Edited" : ""}</p><button type="button" onClick={() => void markClassAnnouncementRead(row.id).then(() => setRows(current => current.map(item => item.id === row.id ? { ...item, readAt: new Date().toISOString(), readRevision: item.revision } : item)))} className="mt-4 min-h-11 rounded-xl border px-4 font-semibold">{isUnread(row) ? "Mark as read" : "Read"}</button></li>)}</ul></section></MainLayout>;
}
