export function nextDuplicateTitle(
  sourceTitle: string,
  existingTitles: readonly string[]
): string {
  const baseTitle = sourceTitle.replace(/ \(Copy(?: \d+)?\)$/, "");
  const existing = new Set(existingTitles);
  let copyNumber = 1;
  while (true) {
    const suffix = copyNumber === 1 ? " (Copy)" : ` (Copy ${copyNumber})`;
    const candidate = `${baseTitle}${suffix}`;
    if (!existing.has(candidate)) return candidate;
    copyNumber += 1;
  }
}
