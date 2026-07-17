import {
  useCallback,
  useEffect,
  useState,
} from "react";

export function useAssessmentReadiness(
  requiredKeys: string[],
  onReadyChange?: (ready: boolean) => void
) {
  const [readyKeys, setReadyKeys] = useState(
    () => new Set<string>()
  );

  const requiredSignature =
    requiredKeys.join("|");

  useEffect(() => {
    const required =
      requiredSignature.length > 0
        ? requiredSignature.split("|")
        : [];

    onReadyChange?.(
      required.every((key) =>
        readyKeys.has(key)
      )
    );
  }, [
    onReadyChange,
    readyKeys,
    requiredSignature,
  ]);

  return useCallback(
    (key: string, ready: boolean) => {
      setReadyKeys((previous) => {
        if (
          previous.has(key) === ready
        ) {
          return previous;
        }

        const updated = new Set(previous);

        if (ready) {
          updated.add(key);
        } else {
          updated.delete(key);
        }

        return updated;
      });
    },
    []
  );
}
