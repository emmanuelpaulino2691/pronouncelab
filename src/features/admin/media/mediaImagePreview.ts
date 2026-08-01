import type { MediaKind } from "../../../domain/media";

export type ImagePreviewState = "ready" | "error" | "retrying";
export type ImagePreviewEvent = "loaded" | "failed" | "retry";

export function canOpenImagePreview(kind: MediaKind, enabled: boolean) {
  return kind === "image" && enabled;
}

export function imagePreviewTitle(filename: string) {
  return `Image preview: ${filename}`;
}

export function imagePreviewAlt(filename: string) {
  return `Full-size preview of ${filename}`;
}

export function nextImagePreviewState(
  _current: ImagePreviewState,
  event: ImagePreviewEvent
): ImagePreviewState {
  if (event === "retry") return "retrying";
  if (event === "failed") return "error";
  return "ready";
}

export const mediaImagePreviewDialogClassName =
  "h-[calc(100dvh-1rem)] max-w-6xl sm:h-auto sm:max-h-[calc(100dvh-2rem)]";

export const mediaImagePreviewImageClassName =
  "mx-auto block h-auto max-w-full object-contain";
