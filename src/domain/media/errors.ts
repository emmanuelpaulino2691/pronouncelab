export class MediaLibraryUnavailableError extends Error {
  readonly code = "MEDIA_LIBRARY_UNAVAILABLE";
  constructor(message = "Media Library backend is unavailable.") { super(message); this.name = "MediaLibraryUnavailableError"; }
}
