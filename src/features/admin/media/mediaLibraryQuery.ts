import { mediaLibrarySorts, type MediaKind, type MediaLibraryQuery, type MediaLibrarySort } from "../../../domain/media";

export function parseMediaLibraryQuery(params: URLSearchParams): MediaLibraryQuery {
  const requestedKind = params.get("kind");
  const kind: MediaKind | "all" = requestedKind === "image" || requestedKind === "audio" ? requestedKind : "all";
  const requestedSort = params.get("sort");
  const sort: MediaLibrarySort = mediaLibrarySorts.includes(requestedSort as MediaLibrarySort) ? requestedSort as MediaLibrarySort : "newest";
  return { kind, search: params.get("search")?.trim() ?? "", sort };
}

export function updateMediaLibraryQuery(current: URLSearchParams, update: Partial<MediaLibraryQuery>) {
  const next = new URLSearchParams(current);
  for (const [key, value] of Object.entries(update)) {
    if (!value || value === "all" || value === "newest") next.delete(key); else next.set(key, String(value));
  }
  return next;
}
