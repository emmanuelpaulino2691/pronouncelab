import type { HTMLAttributes, ReactNode } from "react";
import AdminIcon, { type AdminIconName } from "./AdminIcon";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgb(15_23_42/0.05)] ${className}`} {...props} />;
}
const tones = {
  neutral: "bg-slate-100 text-slate-700 ring-slate-200", draft: "bg-amber-50 text-amber-800 ring-amber-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200", warning: "bg-orange-50 text-orange-700 ring-orange-200",
  danger: "bg-red-50 text-red-700 ring-red-200", info: "bg-sky-50 text-sky-700 ring-sky-200",
};
export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: keyof typeof tones }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${tones[tone]}`}>{children}</span>;
}
export function StatusBadge({ status }: { status: string }) {
  const tone = status === "published" ? "success" : status === "draft" ? "draft" : status === "archived" ? "neutral" : "warning";
  return <Badge tone={tone}>{status.replaceAll("_", " ")}</Badge>;
}
const alertTones = {
  error: "border-red-200 bg-red-50 text-red-800", info: "border-sky-200 bg-sky-50 text-sky-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800", warning: "border-amber-200 bg-amber-50 text-amber-900",
};
export function Alert({ children, tone = "info", action }: { children: ReactNode; tone?: keyof typeof alertTones; action?: ReactNode }) {
  return <div role={tone === "error" ? "alert" : "status"} className={`flex flex-col gap-3 rounded-xl border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between ${alertTones[tone]}`}>
    <div className="flex items-start gap-2"><AdminIcon name="info" className="mt-0.5 h-4 w-4 shrink-0" /><div>{children}</div></div>{action}
  </div>;
}
export function LoadingSkeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-xl bg-slate-200 ${className}`} />;
}
export function Avatar({ label }: { label: string }) {
  const initials = label.split(/\s|@/).filter(Boolean).slice(0, 2).map((word) => word[0]?.toUpperCase()).join("");
  return <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">{initials || "PL"}</span>;
}
export function EmptyState({ title, description, icon = "book", action }: { title: string; description: string; icon?: AdminIconName; action?: ReactNode }) {
  return <Card className="px-6 py-14 text-center">
    <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-600"><AdminIcon name={icon} className="h-6 w-6" /></span>
    <h2 className="mt-4 text-lg font-bold text-slate-950">{title}</h2>
    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">{description}</p>
    {action && <div className="mt-6 flex justify-center">{action}</div>}
  </Card>;
}
