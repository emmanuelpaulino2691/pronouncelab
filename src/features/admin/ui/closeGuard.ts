export type CloseGuardState = {
  hasUnsavedChanges: boolean;
  submissionSucceeded?: boolean;
};

export function shouldProceedWithClose(
  {
    hasUnsavedChanges,
    submissionSucceeded = false,
  }: CloseGuardState,
  confirmDiscard: () => boolean
): boolean {
  if (
    !hasUnsavedChanges ||
    submissionSucceeded
  ) {
    return true;
  }

  return confirmDiscard();
}
