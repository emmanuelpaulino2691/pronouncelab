import { describe, expect, it } from "vitest";
import { smartBuilderEmptyActions, smartBuilderGridClassName } from "./smartBuilderPresentation";

describe("Smart Builder presentation", () => {
  it("uses one, two, and three-column responsive template layouts", () => { expect(smartBuilderGridClassName).toContain("grid"); expect(smartBuilderGridClassName).toContain("sm:grid-cols-2"); expect(smartBuilderGridClassName).toContain("lg:grid-cols-3"); });
  it("offers the intelligent empty-state entry points", () => expect(smartBuilderEmptyActions).toEqual(["Create from Template", "Recently Used", "Favorites", "Blank Activities"]));
});
