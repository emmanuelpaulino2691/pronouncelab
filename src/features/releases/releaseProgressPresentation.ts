import type { ReleaseLessonState } from "./releaseService";

export function releaseLessonPresentation(state: ReleaseLessonState["state"] | undefined) {
  if (state === "completed") return { label:"Completed", linked:true, className:"border-emerald-200 bg-emerald-50 text-emerald-800" } as const;
  if (state === "available") return { label:"Available", linked:true, className:"border-blue-300 bg-blue-50 text-blue-800" } as const;
  return { label:"Locked", linked:false, className:"border-slate-200 bg-slate-100 text-slate-500" } as const;
}
