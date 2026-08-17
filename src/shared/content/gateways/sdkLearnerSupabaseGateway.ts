import { supabase } from "../../lib/supabaseClient";
import {
  infrastructureFailure,
  type LearnerInfrastructureResult,
} from "../infrastructure/learnerInfrastructureErrors";
import type { LearnerSupabaseGateway } from "./LearnerSupabaseGateway";

type SdkResponse = {
  data: unknown;
  error: unknown;
  status: number;
  statusText: string;
};

type RpcRequest = PromiseLike<SdkResponse> & {
  abortSignal(signal: AbortSignal): PromiseLike<SdkResponse>;
};

export interface LearnerRpcClient {
  rpc(
    name: string,
    parameters: Record<string, unknown>
  ): RpcRequest;
}

function errorField(
  error: unknown,
  field: string
): unknown {
  return typeof error === "object" && error !== null
    ? Reflect.get(error, field)
    : undefined;
}

function normalizeSdkError(
  error: unknown,
  status: number | undefined,
  signal?: AbortSignal
): LearnerInfrastructureResult<never> {
  if (
    signal?.aborted ||
    errorField(error, "name") === "AbortError"
  ) {
    return infrastructureFailure(
      "aborted",
      "The learner content request was cancelled."
    );
  }

  if (status === 401) {
    return infrastructureFailure(
      "unauthorized",
      "Learner content authorization is required."
    );
  }
  if (status === 403) {
    return infrastructureFailure(
      "forbidden",
      "Learner content access was denied."
    );
  }
  if (
    typeof status === "number" &&
    (status === 0 || status >= 500)
  ) {
    return infrastructureFailure(
      "unavailable",
      "Published learner content is temporarily unavailable.",
      true
    );
  }
  if (
    error instanceof TypeError
  ) {
    return infrastructureFailure(
      "unavailable",
      "Published learner content is temporarily unavailable.",
      true
    );
  }

  return infrastructureFailure(
    "unexpected",
    "Published learner content could not be loaded."
  );
}

async function execute(
  client: LearnerRpcClient | null,
  name: string,
  parameters: Record<string, unknown>,
  signal?: AbortSignal
): Promise<LearnerInfrastructureResult<unknown>> {
  if (signal?.aborted) {
    return infrastructureFailure(
      "aborted",
      "The learner content request was cancelled."
    );
  }
  if (!client) {
    return infrastructureFailure(
      "unavailable",
      "Published learner content is not configured.",
      true
    );
  }

  try {
    const request = client.rpc(name, parameters);
    const response = await (signal
      ? request.abortSignal(signal)
      : request);

    if (signal?.aborted) {
      return infrastructureFailure(
        "aborted",
        "The learner content request was cancelled."
      );
    }
    if (response.error) {
      return normalizeSdkError(
        response.error,
        response.status,
        signal
      );
    }
    if (response.data === null) {
      return infrastructureFailure(
        "invalid_response",
        "Published learner content returned an invalid response."
      );
    }
    return { ok: true, value: response.data };
  } catch (error) {
    return normalizeSdkError(
      error,
      undefined,
      signal
    );
  }
}

export function createSdkLearnerSupabaseGateway(
  client: LearnerRpcClient | null
): LearnerSupabaseGateway {
  return {
    getPublishedLearningCatalog(signal) {
      return execute(
        client,
        "get_published_learning_catalog",
        { requested_schema_version: 1 },
        signal
      );
    },

    getPublishedLesson(lessonId, signal) {
      return execute(
        client,
        "get_published_lesson",
        {
          requested_lesson_id: lessonId,
          requested_schema_version: 1,
        },
        signal
      );
    },
  };
}

// Migration 010 is intentionally absent, so this cast is isolated here rather
// than weakening generated or application-wide Supabase types.
const learnerRpcClient =
  supabase as unknown as LearnerRpcClient | null;

export const sdkLearnerSupabaseGateway =
  createSdkLearnerSupabaseGateway(
    learnerRpcClient
  );
