import type { ContentProviderError } from "./errors/contentErrors";

export function hasLearnerLoadFailure(
  loading: boolean,
  error: ContentProviderError | null
) {
  return !loading && error !== null && error.code !== "not_found";
}
