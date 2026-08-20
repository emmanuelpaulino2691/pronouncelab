import { useEffect, useState } from "react";
import { editClassAnnouncement, listClassAnnouncements, publishClassAnnouncement, withdrawClassAnnouncement, type ClassAnnouncement } from "../../classes/classAnnouncementService";
import { Button, Card, Dialog, TextArea, TextInput } from "../ui";

export function AdminClassAnnouncements({ classId }: { classId: number }) {
  const [rows, setRows] = useState<ClassAnnouncement[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [removing, setRemoving] = useState<ClassAnnouncement | null>(null);
  const [removingPending, setRemovingPending] = useState(false);
  const load = () => void listClassAnnouncements(classId).then(setRows).catch(() => setError("Announcements could not be loaded."));
  useEffect(load, [classId]);
  const submit = () => void (editing ? editClassAnnouncement(editing, title, body) : publishClassAnnouncement(classId, title, body)).then(() => { setTitle(""); setBody(""); setEditing(null); load(); }).catch(() => setError("Announcement could not be saved."));
  const remove = async () => {
    if (!removing || removingPending) return;
    setRemovingPending(true);
    try { await withdrawClassAnnouncement(removing.id); setRemoving(null); await listClassAnnouncements(classId).then(setRows); }
    catch { setError("Announcement could not be removed."); }
    finally { setRemovingPending(false); }
  };
  return <Card className="space-y-5 p-6"><div><h2 className="text-xl font-bold">Announcements</h2><p className="mt-1 text-sm text-slate-600">Publish a message to every active learner in this Class.</p></div><div className="grid gap-3"><TextInput aria-label="Announcement title" value={title} maxLength={160} placeholder="Title" onChange={e => setTitle(e.target.value)} /><TextArea aria-label="Announcement message" value={body} maxLength={5000} placeholder="Message" onChange={e => setBody(e.target.value)} /><div className="flex gap-3"><Button disabled={!title.trim() || !body.trim()} onClick={submit}>{editing ? "Save announcement" : "Publish announcement"}</Button>{editing && <Button variant="secondary" onClick={() => { setEditing(null); setTitle(""); setBody(""); }}>Cancel</Button>}</div>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}</div><div className="space-y-3">{rows.map(row => <article key={row.id} className="rounded-xl border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-bold">{row.title}</h3><p className="mt-1 text-sm text-slate-600">{`${row.readCount} / ${row.activeLearners} read`}{row.editedAt ? " · Edited" : ""}</p></div><div className="flex gap-2"><Button variant="secondary" onClick={() => { setEditing(row.id); setTitle(row.title); setBody(row.body); }}>Edit</Button><Button variant="secondary" onClick={() => setRemoving(row)}>Remove</Button></div></div><p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{row.body}</p></article>)}</div><Dialog isOpen={removing !== null} onClose={() => { if (!removingPending) setRemoving(null); }} title="Remove announcement" description="Students will no longer be able to view this announcement or its related notifications. This cannot be restored from the normal Teacher workspace." preventClose={removingPending} className="max-w-lg" footer={<><Button variant="secondary" disabled={removingPending} onClick={() => setRemoving(null)}>Cancel</Button><Button variant="danger" isLoading={removingPending} onClick={() => void remove()}>Remove</Button></>}><p className="text-sm text-slate-700">The announcement will be removed from the normal Class history.</p></Dialog></Card>;
}
