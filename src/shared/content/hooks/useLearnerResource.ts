import { useCallback, useEffect, useRef, useState } from "react";

import type { ContentProviderError, ContentResult } from "../errors/contentErrors";

export type LearnerResourceState<T> = {
  value: T | null;
  loading: boolean;
  error: ContentProviderError | null;
  retry: () => void;
};

export function useLearnerResource<T>(
  load: (signal: AbortSignal) => Promise<ContentResult<T>>,
  dependencies: readonly unknown[]
): LearnerResourceState<T> {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<Omit<LearnerResourceState<T>, "retry">>({ value: null, loading: true, error: null });
  const requestRef = useRef(0);
  const retry = useCallback(() => {
    setState((current) => ({ ...current, loading: true, error: null }));
    setRevision((value) => value + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const request = ++requestRef.current;
    void load(controller.signal).then((result) => {
      if (controller.signal.aborted || request !== requestRef.current) return;
      setState(result.ok
        ? { value: result.value, loading: false, error: null }
        : { value: null, loading: false, error: result.error });
    });
    return () => controller.abort();
    // The caller supplies the semantic request dependencies deliberately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, revision]);

  return { ...state, retry };
}
