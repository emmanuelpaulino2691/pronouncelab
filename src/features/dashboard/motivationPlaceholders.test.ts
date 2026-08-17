import { describe, expect, it } from "vitest";
import { futureMotivationItems, motivationUnavailableMessage } from "./motivationPlaceholders";

describe("future learner motivation presentation", () => {
  it("does not present invented motivation values", () => { expect(futureMotivationItems).toEqual(["Daily goal", "Learning streak", "Achievements", "Assignments"]); expect(motivationUnavailableMessage).toContain("account-synchronized learning"); expect(motivationUnavailableMessage).not.toMatch(/\d/); });
});
