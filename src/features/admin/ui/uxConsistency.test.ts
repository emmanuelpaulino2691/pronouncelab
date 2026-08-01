import { describe, expect, it } from "vitest";
import { getEmptyClassesContent } from "../classes/classEmptyState";
import { buttonClassName } from "./buttonStyles";

describe("Teacher CMS UX consistency", () => {
  it("uses the shared minimum touch target for every button variant", () => {
    expect(buttonClassName("primary")).toContain("min-h-11");
    expect(buttonClassName("secondary")).toContain("min-h-11");
    expect(buttonClassName("danger")).toContain("min-h-11");
  });

  it("gives danger actions a consistent destructive treatment", () => {
    expect(buttonClassName("danger")).toContain("bg-red-600");
    expect(buttonClassName("danger")).toContain("text-white");
  });

  it("does not offer class setup to unauthorized roles", () => {
    expect(getEmptyClassesContent(false).showSetupAction).toBe(false);
    expect(getEmptyClassesContent(true).showSetupAction).toBe(true);
  });
});
