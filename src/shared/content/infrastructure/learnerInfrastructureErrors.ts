export type LearnerInfrastructureErrorCode =
  | "unavailable"
  | "not_found"
  | "invalid_response"
  | "aborted"
  | "unauthorized"
  | "forbidden"
  | "unexpected";

export type LearnerInfrastructureError = {
  code: LearnerInfrastructureErrorCode;
  message: string;
  retryable: boolean;
};

export type LearnerInfrastructureResult<T> =
  | { ok: true; value: T }
  | {
      ok: false;
      error: LearnerInfrastructureError;
    };

export function infrastructureFailure(
  code: LearnerInfrastructureErrorCode,
  message: string,
  retryable = false
): LearnerInfrastructureResult<never> {
  return {
    ok: false,
    error: { code, message, retryable },
  };
}
