import { describe, expect, it } from "vitest";
import { futureMotivationItems, motivationUnavailableMessage } from "./motivationPlaceholders";

describe("future learner motivation presentation", () => {
  it("does not present invented XP or streak values", () => { expect(futureMotivationItems).toContain("XP"); expect(futureMotivationItems).toContain("Learning streak"); expect(motivationUnavailableMessage).toContain("synchronized progress"); expect(motivationUnavailableMessage).not.toMatch(/\d/); });
});
