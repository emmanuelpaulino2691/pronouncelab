export const commandPalettePanelClassName = "h-[100dvh] max-w-3xl rounded-none sm:h-auto sm:rounded-2xl";

export function splitCommandMatch(title: string, start: number, length: number) {
  if (length <= 0) return { before: title, match: "", after: "" };
  return { before: title.slice(0, start), match: title.slice(start, start + length), after: title.slice(start + length) };
}
