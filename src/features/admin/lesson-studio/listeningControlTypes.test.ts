import { describe, expect, it } from "vitest";

import {
  listeningControlTypes,
  preventListeningFormNavigation,
} from "./listeningControlTypes";

describe("Listening editor control semantics", () => {
  it("keeps upload, replace, and remove outside form submission", () => {
    expect(listeningControlTypes.upload).toBe("button");
    expect(listeningControlTypes.replace).toBe("button");
    expect(listeningControlTypes.remove).toBe("button");
  });

  it("uses the save action as the only submit control", () => {
    expect(listeningControlTypes.save).toBe("submit");
  });

  it("prevents native form navigation", () => {
    let prevented = false;
    preventListeningFormNavigation({
      preventDefault: () => { prevented = true; },
    });
    expect(prevented).toBe(true);
  });
});
