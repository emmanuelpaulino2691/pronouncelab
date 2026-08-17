import { describe, expect, it } from "vitest";

import {
  isMissingAuthorizationRpcError,
  legacyOwnershipPermissions,
} from "./adminAuthorizationCompatibility";

describe("admin authorization compatibility", () => {
  it("recognizes the structured PostgREST missing-function code", () => {
    expect(
      isMissingAuthorizationRpcError({
        code: "PGRST202",
        message: "Function was not found",
      })
    ).toBe(true);
  });

  it("recognizes a structured HTTP 404 when available", () => {
    expect(
      isMissingAuthorizationRpcError({
        status: 404,
      })
    ).toBe(true);
  });

  it("supports schema-cache missing-function errors as a fallback signal", () => {
    expect(
      isMissingAuthorizationRpcError({
        message:
          "Could not find the function public.is_platform_admin in the schema cache",
      })
    ).toBe(true);
  });

  it.each([
    null,
    new Error("Network request failed"),
    { code: "42501", message: "permission denied" },
    { status: 500, message: "server failure" },
  ])("fails closed for unrelated errors", (error) => {
    expect(isMissingAuthorizationRpcError(error)).toBe(false);
  });

  it("preserves the shared legacy catalog without asserting administrator identity", () => {
    expect(legacyOwnershipPermissions(true)).toEqual({
      canViewAllCourses: true,
      isAdmin: false,
    });
    expect(legacyOwnershipPermissions(false)).toEqual({
      canViewAllCourses: false,
      isAdmin: false,
    });
  });
});
