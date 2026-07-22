export type OperationLifecycle<T> = {
  pending: boolean;
  completed: boolean;
  value: T;
  error: string | null;
};

export function createIdleOperation<T>(value: T): OperationLifecycle<T> {
  return { pending: false, completed: false, value, error: null };
}

export function beginOperation<T>(state: OperationLifecycle<T>): OperationLifecycle<T> {
  return state.pending || state.completed
    ? state
    : { ...state, pending: true, error: null };
}

export function completeOperation<T>(
  state: OperationLifecycle<T>,
  value: T
): OperationLifecycle<T> {
  return state.pending
    ? { pending: false, completed: true, value, error: null }
    : state;
}

export function failOperation<T>(
  state: OperationLifecycle<T>,
  error: string
): OperationLifecycle<T> {
  return state.pending
    ? { ...state, pending: false, completed: false, error }
    : state;
}
