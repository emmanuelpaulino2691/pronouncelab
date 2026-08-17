import { getActivityPresentation } from "./activityCatalog";
import type { ActivityType } from "./types";

export type ActivityPickerStatus = "closed" | "idle" | "submitting" | "succeeded";

export type ActivityPickerState = {
  status: ActivityPickerStatus;
  selectedType: ActivityType | null;
};

export function getInitialActivityPickerState(): ActivityPickerState {
  return { status: "closed", selectedType: null };
}

export function openActivityPicker(): ActivityPickerState {
  return { status: "idle", selectedType: null };
}

export function beginActivityCreation(
  state: ActivityPickerState,
  type: ActivityType
): ActivityPickerState {
  if (
    state.status === "submitting" ||
    state.status === "succeeded" ||
    !getActivityPresentation(type).canCreate
  ) return state;

  return { status: "submitting", selectedType: type };
}

export function failActivityCreation(state: ActivityPickerState): ActivityPickerState {
  return state.status === "submitting"
    ? { ...state, status: "idle" }
    : state;
}

export function completeActivityCreation(state: ActivityPickerState): ActivityPickerState {
  return state.status === "submitting"
    ? { ...state, status: "succeeded" }
    : state;
}
