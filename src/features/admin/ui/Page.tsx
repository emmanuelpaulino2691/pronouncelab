import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import AdminIcon from "./AdminIcon";

export type BreadcrumbItem = { label: string; to?: string };
export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return <nav aria-label="Breadcrumb"><ol className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
    {items.map((item, index) => <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
      {index > 0 && <AdminIcon name="chevron-right" className="h-3.5 w-3.5 text-slate-400" />}
      {item.to ? <Link className="admin-focus rounded-md font-medium hover:text-blue-700" to={item.to}>{item.label}</Link> : <span aria-current="page" className="font-medium text-slate-700">{item.label}</span>}
    </li>)}
  </ol></nav>;
}
export function PageHeader({ eyebrow, title, description, breadcrumbs, actions, meta }: {
  eyebrow?: string; title: string; description?: string; breadcrumbs?: BreadcrumbItem[]; actions?: ReactNode; meta?: ReactNode;
}) {
  return <header>{breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
    <div className={`${breadcrumbs ? "mt-5" : ""} flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between`}>
      <div className="min-w-0">{eyebrow && <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">{eyebrow}</p>}
        <div className="mt-1 flex flex-wrap items-center gap-3"><h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>{meta}</div>
        {description && <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">{description}</p>}
      </div>{actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  </header>;
}
export function SectionHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-lg font-bold text-slate-950">{title}</h2>{description && <p className="mt-1 text-sm text-slate-600">{description}</p>}</div>{action}</div>;
}
