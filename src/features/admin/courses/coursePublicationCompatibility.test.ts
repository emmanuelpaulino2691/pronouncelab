import { describe, expect, it } from "vitest";
import { isMissingCoursePublicationRpcError } from "./adminCourseService";

describe("course publication compatibility", () => {
  it("recognizes only missing-function responses as unavailable", () => {
    expect(isMissingCoursePublicationRpcError({ code: "PGRST202", status: 404 })).toBe(true);
    expect(isMissingCoursePublicationRpcError({ status: 500, message: "network failure" })).toBe(false);
    expect(isMissingCoursePublicationRpcError({ code: "42501" })).toBe(false);
  });
});
