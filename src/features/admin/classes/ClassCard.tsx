import { ButtonLink, Card } from "../ui";
import type { ClassSummary } from "./classTypes";
import { ClassStatusBadge } from "./ClassStatusBadge";

export function ClassCard({ classSummary }: { classSummary: ClassSummary }) {
  return <Card className="flex min-h-56 flex-col p-5 sm:p-6">
    <div className="flex items-start justify-between gap-3"><h2 className="text-lg font-bold text-slate-950">{classSummary.name}</h2><ClassStatusBadge status={classSummary.status} /></div>
    <dl className="mt-5 grid grid-cols-2 gap-3 text-sm text-slate-600">
      <div><dt className="text-xs text-slate-500">Courses</dt><dd className="font-semibold">{classSummary.courseCount ?? "—"}</dd></div>
      <div><dt className="text-xs text-slate-500">Students</dt><dd className="font-semibold">{classSummary.studentCount ?? "—"}</dd></div>
    </dl>
    {classSummary.term && <p className="mt-4 text-sm text-slate-600">{classSummary.term}</p>}
    <ButtonLink to={`/admin/classes/${classSummary.id}`} variant="secondary" className="mt-auto">Open class</ButtonLink>
  </Card>;
}
