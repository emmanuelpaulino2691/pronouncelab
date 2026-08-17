import { describe, expect, it } from "vitest";

import {
  beginActivityCreation,
  completeActivityCreation,
  failActivityCreation,
  getInitialActivityPickerState,
  openActivityPicker,
} from "./activityPickerState";

describe("activity picker state", () => {
  it("starts closed and opens idle", () => {
    expect(getInitialActivityPickerState()).toEqual({ status: "closed", selectedType: null });
    expect(openActivityPicker()).toEqual({ status: "idle", selectedType: null });
  });

  it("selects a catalogue-supported creatable type", () => {
    expect(beginActivityCreation(openActivityPicker(), "quiz")).toEqual({
      status: "submitting",
      selectedType: "quiz",
    });
  });

  it("does not allow Practice to enter creation", () => {
    expect(beginActivityCreation(openActivityPicker(), "practice")).toEqual(openActivityPicker());
  });

  it("prevents repeat creation during submission", () => {
    const submitting = beginActivityCreation(openActivityPicker(), "theory");
    expect(beginActivityCreation(submitting, "listening")).toBe(submitting);
  });

  it("preserves the selected type after failure and allows retry", () => {
    const submitting = beginActivityCreation(openActivityPicker(), "pronunciation");
    const failed = failActivityCreation(submitting);
    expect(failed).toEqual({ status: "idle", selectedType: "pronunciation" });
    expect(beginActivityCreation(failed, "pronunciation").status).toBe("submitting");
  });

  it("completes only once", () => {
    const submitting = beginActivityCreation(openActivityPicker(), "ai_speaking_mission");
    const succeeded = completeActivityCreation(submitting);
    expect(succeeded.status).toBe("succeeded");
    expect(completeActivityCreation(succeeded)).toBe(succeeded);
  });
});
