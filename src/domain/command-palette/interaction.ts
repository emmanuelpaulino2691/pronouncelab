export type PaletteKeyAction = "next" | "previous" | "select" | "close" | "none";

export function getPaletteKeyAction(key: string): PaletteKeyAction {
  if (key === "ArrowDown") return "next";
  if (key === "ArrowUp") return "previous";
  if (key === "Enter") return "select";
  if (key === "Escape") return "close";
  return "none";
}

export function getPointerSelection(index: number, resultCount: number) {
  return Number.isInteger(index) && index >= 0 && index < resultCount ? index : -1;
}
