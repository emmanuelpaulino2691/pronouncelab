import type { MediaKind, MediaLibrarySort } from "./types";

export const mediaKinds = ["image", "audio"] as const satisfies readonly MediaKind[];
export const mediaLibrarySorts = ["newest", "oldest", "name-asc", "name-desc"] as const satisfies readonly MediaLibrarySort[];
export const mediaLibraryUnavailableMessage = "Media Library is not available until the pending backend update is installed.";
export const adminMediaLibraryPath = "/admin/media";
