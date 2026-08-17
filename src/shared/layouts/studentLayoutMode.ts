export type StudentLayoutMode = "auto" | "desktop" | "tablet" | "phone";

export function usesCompactStudentShell(mode: StudentLayoutMode) {
  return mode === "tablet" || mode === "phone";
}

export function studentSidebarClass(mode: StudentLayoutMode) {
  if (mode === "desktop") return "block";
  if (usesCompactStudentShell(mode)) return "hidden";
  return "hidden lg:block";
}

export function studentMenuButtonClass(mode: StudentLayoutMode) {
  if (mode === "desktop") return "hidden";
  if (usesCompactStudentShell(mode)) return "inline-flex";
  return "inline-flex lg:hidden";
}

export function studentContentPaddingClass(mode: StudentLayoutMode) {
  if (mode === "phone") return "p-3";
  if (mode === "tablet") return "p-5";
  if (mode === "desktop") return "p-8";
  return "p-4 sm:p-8";
}
