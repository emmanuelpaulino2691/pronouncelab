export type PronunciationBlockType = "word_list" | "minimal_pairs";

export type MinimalPair = { left: string; right: string };

export type PronunciationBlockEntry = string | MinimalPair;

export function parseWordLines(input: string): string[] {
  return input.split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
}

export function parseMinimalPairLines(input: string): MinimalPair[] {
  return input.split(/\r?\n/).flatMap((line) => {
    const separator = line.includes("\t") ? "\t" : ",";
    const values = line.split(separator).map((value) => value.trim());
    return values.length === 2 && values[0] && values[1]
      ? [{ left: values[0], right: values[1] }]
      : [];
  });
}

export function moveEntry<T>(entries: readonly T[], index: number, direction: -1 | 1): T[] {
  const destination = index + direction;
  if (index < 0 || index >= entries.length || destination < 0 || destination >= entries.length) {
    return [...entries];
  }
  const next = [...entries];
  [next[index], next[destination]] = [next[destination], next[index]];
  return next;
}

export function removeEntry<T>(entries: readonly T[], index: number): T[] {
  return entries.filter((_, entryIndex) => entryIndex !== index);
}

export function getPronunciationEntriesError(
  type: PronunciationBlockType,
  entries: readonly PronunciationBlockEntry[]
): string {
  if (type === "word_list") {
    return entries.some((entry) => typeof entry !== "string" || !entry.trim()) || entries.length === 0
      ? "Add at least one word."
      : "";
  }
  return entries.some((entry) => typeof entry === "string" || !entry.left.trim() || !entry.right.trim()) || entries.length === 0
    ? "Add at least one complete minimal pair."
    : "";
}

export function normalizePronunciationEntries(
  type: PronunciationBlockType,
  entries: readonly PronunciationBlockEntry[]
): PronunciationBlockEntry[] {
  return type === "word_list"
    ? entries.flatMap((entry) => typeof entry === "string" && entry.trim() ? [entry.trim()] : [])
    : entries.flatMap((entry) => typeof entry !== "string" && entry.left.trim() && entry.right.trim()
      ? [{ left: entry.left.trim(), right: entry.right.trim() }]
      : []);
}
