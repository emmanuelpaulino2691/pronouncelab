import { Link, useParams } from "react-router-dom";
import { Card, PageHeader } from "../ui";

const tabs = ["Overview", "Students", "Courses", "Assignments", "Progress", "Settings"];

export function ClassWorkspaceLayout() {
  const { classId } = useParams();
  return <section className="mx-auto max-w-7xl space-y-6"><PageHeader eyebrow="My Classes" title="Class Workspace" breadcrumbs={[{ label: "My Classes", to: "/admin/classes" }, { label: "Class Workspace" }]} description={`Class ${classId ?? ""} will be available after classroom implementation.`} actions={<Link to="/admin/classes" className="admin-focus inline-flex min-h-10 items-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Back to My Classes</Link>} /><nav aria-label="Class workspace" className="flex gap-2 overflow-x-auto border-b border-slate-200">{tabs.map((tab) => <span key={tab} aria-disabled="true" className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-slate-400">{tab}</span>)}</nav><Card className="p-10 text-center"><h2 className="text-xl font-bold text-slate-950">This workspace will become available after Classroom implementation.</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">No class data is loaded or simulated in this preview.</p></Card></section>;
}
