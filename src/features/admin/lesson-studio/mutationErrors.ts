export type LessonStudioMutationOperation =
  | "add block"
  | "save block"
  | "delete block"
  | "duplicate block"
  | "save block order"
  | "save activity"
  | "add activity"
  | "delete activity"
  | "reorder activities"
  | "save quiz settings"
  | "add question"
  | "save question"
  | "delete question"
  | "reorder questions"
  | "save listening content"
  | "upload media";

function backendMessage(error: unknown) {
  if (!error || typeof error !== "object") return "";
  const message = (error as { message?: unknown }).message;
  return typeof message === "string" ? message : "";
}

export function lessonStudioMutationErrorMessage(
  error: unknown,
  operation: LessonStudioMutationOperation
) {
  if (error instanceof Error && error.constructor === Error && error.message.trim()) {
    return error.message;
  }

  const message = backendMessage(error);
  if (/permission denied|row-level security|permission is required/i.test(message)) {
    return `You no longer have permission to ${operation}. Refresh the Studio or contact an administrator.`;
  }
  if (/stale|save conflict|changed in another/i.test(message)) {
    return `Unable to ${operation} because this content changed elsewhere. Refresh the Studio and try again.`;
  }
  return `Unable to ${operation}. Your content is unchanged. Try again.`;
}
