export function hasListeningTranscript(
  transcript: string | undefined
): boolean {
  return Boolean(transcript?.trim());
}
