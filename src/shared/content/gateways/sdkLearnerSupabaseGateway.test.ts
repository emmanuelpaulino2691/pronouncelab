import { describe, expect, it } from "vitest";

import type { DecimalContentId } from "../contracts/publishedRpc";
import {
  createSdkLearnerSupabaseGateway,
  type LearnerRpcClient,
} from "./sdkLearnerSupabaseGateway";

function request(
  response: {
    data: unknown;
    error: unknown;
    status?: number;
    statusText?: string;
  }
) {
  const promise = Promise.resolve({
    status: 200,
    statusText: "OK",
    ...response,
  });
  return {
    then: promise.then.bind(promise),
    abortSignal: () => promise,
  };
}

describe("sdkLearnerSupabaseGateway", () => {
  it("calls the catalog RPC with its schema version", async () => {
    const calls: unknown[] = [];
    const client: LearnerRpcClient = {
      rpc(name, parameters) {
        calls.push([name, parameters]);
        return request({ data: {}, error: null });
      },
    };

    await createSdkLearnerSupabaseGateway(
      client
    ).getPublishedLearningCatalog();

    expect(calls).toEqual([
      [
        "get_published_learning_catalog",
        { requested_schema_version: 1 },
      ],
    ]);
  });

  it("passes the decimal lesson ID without numeric conversion", async () => {
    const calls: unknown[] = [];
    const client: LearnerRpcClient = {
      rpc(name, parameters) {
        calls.push([name, parameters]);
        return request({ data: {}, error: null });
      },
    };

    await createSdkLearnerSupabaseGateway(
      client
    ).getPublishedLesson(
      "9007199254740993" as DecimalContentId
    );

    expect(calls).toEqual([
      [
        "get_published_lesson",
        {
          requested_lesson_id:
            "9007199254740993",
          requested_schema_version: 1,
        },
      ],
    ]);
  });

  it("normalizes successful SDK responses", async () => {
    const payload = { schemaVersion: 1 };
    const gateway =
      createSdkLearnerSupabaseGateway({
        rpc: () =>
          request({ data: payload, error: null }),
      });

    await expect(
      gateway.getPublishedLearningCatalog()
    ).resolves.toEqual({
      ok: true,
      value: payload,
    });
  });

  it.each([
    [401, "unauthorized", false],
    [403, "forbidden", false],
    [503, "unavailable", true],
  ] as const)(
    "normalizes SDK status %s without exposing its error",
    async (status, code, retryable) => {
      const rawError = {
        code: "PGRST_TEST",
        message: "sensitive backend detail",
        details: "sensitive details",
        hint: "sensitive hint",
      };
      const gateway =
        createSdkLearnerSupabaseGateway({
          rpc: () =>
            request({
              data: null,
              error: rawError,
              status,
              statusText:
                status === 401
                  ? "Unauthorized"
                  : status === 403
                    ? "Forbidden"
                    : "Service Unavailable",
            }),
        });

      const result =
        await gateway.getPublishedLearningCatalog();

      expect(result).toMatchObject({
        ok: false,
        error: { code, retryable },
      });
      expect(result).not.toContain(rawError);
      expect(JSON.stringify(result)).not.toContain(
        "sensitive backend detail"
      );
      expect(JSON.stringify(result)).not.toContain(
        "sensitive details"
      );
      expect(JSON.stringify(result)).not.toContain(
        "sensitive hint"
      );
      expect(JSON.stringify(result)).not.toContain(
        "Service Unavailable"
      );
    }
  );

  it("rejects a null success response at the gateway boundary", async () => {
    const gateway =
      createSdkLearnerSupabaseGateway({
        rpc: () =>
          request({ data: null, error: null }),
      });

    await expect(
      gateway.getPublishedLearningCatalog()
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "invalid_response" },
    });
  });

  it("preserves AbortSignal through the SDK request", async () => {
    const controller = new AbortController();
    let receivedSignal: AbortSignal | undefined;
    const response = Promise.resolve({
      data: {},
      error: null,
      status: 200,
      statusText: "OK",
    });
    const gateway =
      createSdkLearnerSupabaseGateway({
        rpc: () => ({
          then: response.then.bind(response),
          abortSignal(signal) {
            receivedSignal = signal;
            controller.abort();
            return response;
          },
        }),
      });

    const result =
      await gateway.getPublishedLearningCatalog(
        controller.signal
      );

    expect(receivedSignal).toBe(controller.signal);
    expect(result).toMatchObject({
      ok: false,
      error: { code: "aborted" },
    });
  });

  it("normalizes thrown network failures as unavailable", async () => {
    const gateway =
      createSdkLearnerSupabaseGateway({
        rpc: () => {
          throw new TypeError("Failed to fetch");
        },
      });

    await expect(
      gateway.getPublishedLearningCatalog()
    ).resolves.toMatchObject({
      ok: false,
      error: {
        code: "unavailable",
        retryable: true,
      },
    });
  });

  it("prioritizes an already-aborted signal over backend status", async () => {
    const controller = new AbortController();
    controller.abort();
    let called = false;
    const gateway =
      createSdkLearnerSupabaseGateway({
        rpc: () => {
          called = true;
          return request({
            data: null,
            error: {
              code: "PGRST_TEST",
              message: "Backend failure",
              details: "",
              hint: "",
            },
            status: 503,
            statusText: "Service Unavailable",
          });
        },
      });

    await expect(
      gateway.getPublishedLearningCatalog(
        controller.signal
      )
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "aborted" },
    });
    expect(called).toBe(false);
  });
});
