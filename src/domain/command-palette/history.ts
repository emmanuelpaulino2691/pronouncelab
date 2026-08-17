export const commandHistoryKey = "pronouncelab.admin.command-history.v1";

export function recordCommandHistory(ids: readonly string[], id: string, maximum = 20) {
  return [id, ...ids.filter((item) => item !== id)].slice(0, maximum);
}

export function parseCommandHistory(value: string | null) {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch { return []; }
}
