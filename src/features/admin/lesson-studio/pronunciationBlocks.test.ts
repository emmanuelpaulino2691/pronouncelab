import { describe, expect, it } from "vitest";

import {
  getPronunciationEntriesError,
  moveEntry,
  normalizePronunciationEntries,
  parseMinimalPairLines,
  parseWordLines,
  removeEntry,
} from "./pronunciationBlocks";

describe("pronunciation blocks", () => {
  it("parses, trims, and ignores blank word lines while allowing duplicates", () => {
    expect(parseWordLines(" cat\n\ncake\ncat ")).toEqual(["cat", "cake", "cat"]);
  });

  it("parses CSV and tab-separated pairs and ignores malformed rows", () => {
    expect(parseMinimalPairLines("cat,cut\nship\tsheep\ninvalid\na,b,c\n,empty")).toEqual([
      { left: "cat", right: "cut" },
      { left: "ship", right: "sheep" },
    ]);
  });

  it("supports editing helpers for delete and reorder", () => {
    expect(removeEntry(["cat", "cake"], 0)).toEqual(["cake"]);
    expect(moveEntry(["cat", "cake", "came"], 2, -1)).toEqual(["cat", "came", "cake"]);
  });

  it("validates publication completeness and normalizes entries", () => {
    expect(getPronunciationEntriesError("word_list", [])).toBe("Add at least one word.");
    expect(getPronunciationEntriesError("minimal_pairs", [{ left: "cat", right: "" }])).toBe("Add at least one complete minimal pair.");
    expect(normalizePronunciationEntries("minimal_pairs", [{ left: " cat ", right: " cut " }])).toEqual([{ left: "cat", right: "cut" }]);
  });
});
