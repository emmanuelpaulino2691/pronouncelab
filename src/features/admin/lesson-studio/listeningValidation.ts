export const maxListeningAudioBytes = 25 * 1024 * 1024;
export const maxListeningTranscriptLength = 20_000;

export type AudioFileLike = {
  name: string;
  type: string;
  size: number;
};

export function getListeningAudioFileError(
  file: AudioFileLike
): string {
  const hasMp3Extension = file.name.toLowerCase().endsWith(".mp3");
  if (file.type !== "audio/mpeg" && !hasMp3Extension) {
    return "Choose an MP3 audio file.";
  }
  if (file.size <= 0) return "The selected audio file is empty.";
  if (file.size > maxListeningAudioBytes) {
    return "Choose an MP3 file smaller than 25 MB.";
  }
  return "";
}

export function normalizeListeningTranscript(
  transcript: string | null
): string | null {
  const normalized = transcript?.trim() ?? "";
  return normalized || null;
}

export function getListeningTranscriptError(
  transcript: string | null
): string {
  return (transcript?.length ?? 0) > maxListeningTranscriptLength
    ? "Keep the transcript under 20,000 characters."
    : "";
}

export function applyListeningAudioAsset<T extends {
  activityId: number;
  audioAssetId: string | null;
}>(item: T, audioAssetId: string | null): T {
  return { ...item, audioAssetId };
}
