import { describe, expect, it } from "vitest";
import { filterClassSummaries } from "./classFilters";
import type { ClassSummary } from "./classTypes";

const classes: ClassSummary[] = [
  { id: 1, name: "English A2 Morning", status: "active", term: "Spring" },
  { id: 2, name: "Pronunciation Group", status: "draft", term: "Summer" },
];

describe("class filters", () => {
  it("filters by status and teacher search text", () => {
    expect(filterClassSummaries(classes, "morning", "all")).toHaveLength(1);
    expect(filterClassSummaries(classes, "", "draft")).toEqual([classes[1]]);
  });

  it("does not create data when the source is empty", () => {
    expect(filterClassSummaries([], "", "all")).toEqual([]);
  });
});
