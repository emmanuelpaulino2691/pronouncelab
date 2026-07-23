export type DeleteConfirmationState<T> = {
  target: T | null;
  pending: boolean;
};

export function createDeleteConfirmationState<T>(): DeleteConfirmationState<T> {
  return { target: null, pending: false };
}

export function openDeleteConfirmation<T>(
  target: T
): DeleteConfirmationState<T> {
  return { target, pending: false };
}

export function beginDeleteConfirmation<T>(
  state: DeleteConfirmationState<T>
): DeleteConfirmationState<T> {
  return state.target ? { ...state, pending: true } : state;
}

export function cancelDeleteConfirmation<T>(
  state: DeleteConfirmationState<T>
): DeleteConfirmationState<T> {
  return state.pending ? state : createDeleteConfirmationState<T>();
}

export function completeDeleteConfirmation<T>(): DeleteConfirmationState<T> {
  return createDeleteConfirmationState<T>();
}

export function failDeleteConfirmation<T>(
  state: DeleteConfirmationState<T>
): DeleteConfirmationState<T> {
  return { ...state, pending: false };
}
