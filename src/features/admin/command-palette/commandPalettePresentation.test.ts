import { describe, expect, it } from "vitest";
import { commandPalettePanelClassName, splitCommandMatch } from "./commandPalettePresentation";

describe("Command Palette presentation", () => {
  it("uses a phone sheet and a centered wider-screen dialog", () => { expect(commandPalettePanelClassName).toContain("h-[100dvh]"); expect(commandPalettePanelClassName).toContain("sm:h-auto"); expect(commandPalettePanelClassName).toContain("max-w-3xl"); });
  it("splits matching text for highlighting", () => expect(splitCommandMatch("Open Media Library", 5, 5)).toEqual({ before: "Open ", match: "Media", after: " Library" }));
});
