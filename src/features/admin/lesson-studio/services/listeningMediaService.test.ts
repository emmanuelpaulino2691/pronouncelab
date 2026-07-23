import { describe, expect, it } from "vitest";

import {
  getListeningMediaErrorMessage,
  ListeningMediaError,
} from "./listeningMediaService";

describe("Listening media errors", () => {
  it("distinguishes upload and media registration failures", () => {
    expect(getListeningMediaErrorMessage(new ListeningMediaError("upload"))).toContain("could not be uploaded");
    expect(getListeningMediaErrorMessage(new ListeningMediaError("registration"))).toContain("media library");
  });
});
