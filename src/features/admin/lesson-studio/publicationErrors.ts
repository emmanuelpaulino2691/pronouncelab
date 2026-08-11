type BackendError = { message?: unknown; context?: { json?: () => Promise<unknown> } };

const fallback = "The action could not be completed. Your content is unchanged. Try again.";

export function publicationOperationErrorMessage(error: unknown): string {
  const message = error && typeof error === "object" && typeof (error as BackendError).message === "string"
    ? (error as BackendError).message as string
    : "";
  if (/Invalid publication media reference: listening audio/i.test(message))
    return "Listening audio is not ready for learner delivery. Re-upload or replace the affected audio, then publish again.";
  if (/Invalid publication media reference: pronunciation audio/i.test(message))
    return "Pronunciation audio is not ready for learner delivery. Re-upload or replace the affected audio, then publish again.";
  if (/Invalid publication media reference: theory media/i.test(message))
    return "A Learn media block is not ready for learner delivery. Replace the affected media, then publish again.";
  if (/Missing public Storage object/i.test(message))
    return "An attached media file is missing from learner Storage. Re-upload the affected media, then publish again.";
  if (/Listening activities require audio/i.test(message))
    return "A Listening activity is missing required audio. Attach audio to every Listening item, save, and publish again.";
  if (/Pronunciation content is incomplete/i.test(message))
    return "Pronunciation content is incomplete. Review the affected block, save the missing content, and publish again.";
  if (/Only a draft lesson version can be published/i.test(message))
    return "This lesson version is no longer a draft. Refresh the Studio before publishing again.";
  if (/Course owner or administrator permission is required|Course publication permission is required/i.test(message))
    return "You no longer have permission to perform this action. Refresh the Studio or contact an administrator.";
  if (/active published lesson version is invalid/i.test(message))
    return "The lesson's active published version could not be copied. Refresh the Studio and contact an administrator if the issue continues.";
  if (/Lesson does not exist in the expected unit/i.test(message))
    return "The lesson has moved or is no longer available in this unit. Return to the curriculum and open it again.";
  return fallback;
}

export async function publicationFunctionErrorMessage(error: unknown) {
  const context = error && typeof error === "object" ? (error as BackendError).context : undefined;
  if (context?.json) {
    try {
      const body = await context.json() as { message?: unknown };
      if (typeof body?.message === "string" && body.message.trim()) return body.message;
    } catch { /* sanitized fallback below */ }
  }
  return publicationOperationErrorMessage(error);
}
