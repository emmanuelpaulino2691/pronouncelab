import { describe, expect, it } from "vitest";
import { getLearnBlockDefinition, learnBlockRegistry } from "./learnBlockRegistry";

describe("Learn block registry", () => {
  it("keeps the supported block catalogue centralized", () => {
    expect(learnBlockRegistry.map((block) => block.type)).toEqual(["heading", "paragraph", "example", "tip", "image", "audio"]);
  });
  it("resolves definitions without a distributed switch", () => {
    expect(getLearnBlockDefinition("image").title).toBe("Image");
  });
});
