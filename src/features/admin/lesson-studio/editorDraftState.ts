export type EditorDraftState<T> = {
  activityId: number;
  value: T;
  dirty: boolean;
};

export function initializeEditorDraft<T>(activityId: number, value: T): EditorDraftState<T> {
  return { activityId, value, dirty: false };
}

export function updateEditorDraft<T>(state: EditorDraftState<T>, value: T): EditorDraftState<T> {
  return { ...state, value, dirty: true };
}

export function reconcileEditorDraft<T>(
  state: EditorDraftState<T>,
  activityId: number,
  serverValue: T
): EditorDraftState<T> {
  return state.activityId === activityId && state.dirty
    ? state
    : initializeEditorDraft(activityId, serverValue);
}

export function acceptSavedEditorDraft<T>(state: EditorDraftState<T>, savedValue: T): EditorDraftState<T> {
  return { ...state, value: savedValue, dirty: false };
}

export function discardEditorDraft<T>(state: EditorDraftState<T>, serverValue: T): EditorDraftState<T> {
  return initializeEditorDraft(state.activityId, serverValue);
}
