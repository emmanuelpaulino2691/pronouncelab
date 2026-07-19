export type ContentErrorCode =
  | "not_found"
  | "unavailable"
  | "invalid_data"
  | "aborted"
  | "unexpected";

export type ContentProviderError = {
  code: ContentErrorCode;
  message: string;
  retryable: boolean;
};

export type ContentResult<T> =
  | {
      ok: true;
      value: T;
      revision: string;
    }
  | {
      ok: false;
      error: ContentProviderError;
    };

export function contentSuccess<T>(
  value: T,
  revision: string
): ContentResult<T> {
  return {
    ok: true,
    value,
    revision,
  };
}

export function contentFailure(
  code: ContentErrorCode,
  message: string,
  retryable = false
): ContentResult<never> {
  return {
    ok: false,
    error: {
      code,
      message,
      retryable,
    },
  };
}
