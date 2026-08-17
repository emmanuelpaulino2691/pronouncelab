export class MediaLibraryUnavailableError extends Error {
  readonly code = "MEDIA_LIBRARY_UNAVAILABLE";
  constructor(message = "Media Library backend is unavailable.") { super(message); this.name = "MediaLibraryUnavailableError"; }
}

export type MediaLibraryErrorCode = "load" | "permission" | "not_found" | "preview" | "mutation_unavailable";
export class MediaLibraryError extends Error {
  readonly code: MediaLibraryErrorCode;
  constructor(code: MediaLibraryErrorCode) {
    super(code); this.name = "MediaLibraryError";
    this.code = code;
  }
}

export function getMediaLibraryErrorMessage(error: unknown) {
  if (error instanceof MediaLibraryError) {
    if (error.code === "permission") return "You do not have permission to use this media.";
    if (error.code === "not_found") return "This media asset no longer exists.";
    if (error.code === "preview") return "This file preview could not be generated.";
    if (error.code === "mutation_unavailable") return "Shared media replacement and deletion are not available yet.";
  }
  return "Media Library could not be loaded.";
}
