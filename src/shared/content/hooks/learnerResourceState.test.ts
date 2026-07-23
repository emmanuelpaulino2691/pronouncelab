import { describe, expect, it } from "vitest";

import { contentFailure, contentSuccess } from "../errors/contentErrors";

describe("learner resource result states", () => {
  it("represents an empty published catalog as a successful empty result", () => {
    expect(contentSuccess([], "revision")).toMatchObject({ ok: true, value: [] });
  });

  it("keeps unavailable published content distinct from not found", () => {
    expect(contentFailure("unavailable", "Unavailable.")).toMatchObject({ ok: false, error: { code: "unavailable" } });
    expect(contentFailure("not_found", "Missing.")).toMatchObject({ ok: false, error: { code: "not_found" } });
  });
});
