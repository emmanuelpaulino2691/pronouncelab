import type { ClassStatus } from "./classTypes";

const labels: Record<ClassStatus, string> = { draft: "Draft", active: "Active", archived: "Archived" };

export function ClassStatusBadge({ status }: { status: ClassStatus }) {
  return <span className="inline-flex rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">{labels[status]}</span>;
}
