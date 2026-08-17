export const favoriteTemplatesKey = "pronouncelab.admin.template-favorites.v1";
export const recentTemplatesKey = "pronouncelab.admin.template-recents.v1";

export function toggleFavorite(ids: readonly string[], id: string) {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [id, ...ids];
}

export function recordRecent(ids: readonly string[], id: string, maximum = 10) {
  return [id, ...ids.filter((item) => item !== id)].slice(0, maximum);
}

export function orderFavoriteTemplates<T extends { id: string }>(items: readonly T[], favoriteIds: readonly string[]) {
  return [...items].sort((a, b) => Number(favoriteIds.includes(b.id)) - Number(favoriteIds.includes(a.id)));
}

export function parseStoredTemplateIds(value: string | null, validIds: ReadonlySet<string>) {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string" && validIds.has(item)) : [];
  } catch { return []; }
}
