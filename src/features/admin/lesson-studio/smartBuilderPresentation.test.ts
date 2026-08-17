import { describe, expect, it } from "vitest";
import { smartBuilderEmptyAction, smartBuilderGridClassName } from "./smartBuilderPresentation";

describe("Smart Builder presentation", () => {
  it("uses one, two, and three-column responsive template layouts", () => { expect(smartBuilderGridClassName).toContain("grid"); expect(smartBuilderGridClassName).toContain("sm:grid-cols-2"); expect(smartBuilderGridClassName).toContain("lg:grid-cols-3"); });
  it("offers one truthful empty-state entry point", () => expect(smartBuilderEmptyAction).toBe("Open Smart Content Builder"));
});
