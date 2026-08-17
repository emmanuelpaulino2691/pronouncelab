import { contentFailure, type ContentResult } from "../errors/contentErrors";

export async function settleLearnerResourceLoad<T>(
  load: (signal: AbortSignal) => Promise<ContentResult<T>>,
  signal: AbortSignal,
): Promise<ContentResult<T>> {
  try {
    return await load(signal);
  } catch {
    return signal.aborted
      ? contentFailure("aborted", "The request was cancelled.")
      : contentFailure("unexpected", "Preview could not be loaded. Retry or return to the Studio.", true);
  }
}

export function isCurrentResourceRequest(
  request: number,
  currentRequest: number,
  signal: AbortSignal,
) {
  return !signal.aborted && request === currentRequest;
}
