export type LearnerLayoutMode = "auto" | "desktop" | "tablet" | "phone";

export function usesCompactActivityNavigation(mode: LearnerLayoutMode) {
  return mode === "tablet" || mode === "phone";
}

export function lessonShellClass(mode: LearnerLayoutMode) {
  if (mode === "desktop") return "mx-auto grid max-w-7xl grid-cols-[15rem_minmax(0,1fr)] gap-6 px-8 py-6";
  if (usesCompactActivityNavigation(mode)) return `mx-auto grid w-full min-w-0 grid-cols-1 gap-4 py-4 ${mode === "phone" ? "px-3" : "px-4"}`;
  return "mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:px-8";
}
