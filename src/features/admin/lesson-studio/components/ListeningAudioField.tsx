import { useEffect, useRef, useState } from "react";

import { Button } from "../../ui";
import { listeningControlTypes } from "../listeningControlTypes";
import { getListeningAudioFileError } from "../listeningValidation";
import {
  getListeningAudioAsset,
  getListeningMediaErrorMessage,
  uploadListeningAudio,
  type ListeningAudioAsset,
} from "../services/listeningMediaService";

type Props = {
  activityId: number;
  audioAssetId: string | null;
  disabled: boolean;
  onChange: (assetId: string | null) => void;
  context?: "listening" | "pronunciation";
  attachmentLabel?: string;
  requiredForPublication?: boolean;
};

export default function ListeningAudioField({
  activityId,
  audioAssetId,
  disabled,
  onChange,
  context = "listening",
  attachmentLabel = "listening item",
  requiredForPublication = true,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const localPreviewRef = useRef<string | null>(null);
  const [asset, setAsset] = useState<ListeningAudioAsset | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    if (!audioAssetId) {
      return () => { active = false; };
    }
    void getListeningAudioAsset(audioAssetId)
      .then((value) => {
        if (active) {
          setAsset(value);
          setPreviewUrl(value.previewUrl);
        }
      })
      .catch((error: unknown) => {
        if (active) setMessage(getListeningMediaErrorMessage(error));
      });
    return () => { active = false; };
  }, [audioAssetId]);

  useEffect(() => () => {
    if (localPreviewRef.current) URL.revokeObjectURL(localPreviewRef.current);
  }, []);

  async function chooseFile(file: File | undefined) {
    if (!file || uploading) return;
    const validationError = getListeningAudioFileError(file);
    if (validationError) {
      setMessage(validationError);
      return;
    }

    const previousAsset = asset;
    const previousPreviewUrl = previewUrl;
    if (localPreviewRef.current) URL.revokeObjectURL(localPreviewRef.current);
    localPreviewRef.current = URL.createObjectURL(file);
    setPreviewUrl(localPreviewRef.current);
    setAsset(null);
    setMessage("Uploading audio…");
    setUploading(true);
    try {
      const uploaded = await uploadListeningAudio(activityId, file, context);
      setAsset(uploaded);
      onChange(uploaded.id);
      setMessage(`Audio uploaded. Save the ${attachmentLabel} to attach it.`);
    } catch (error) {
      setAsset(previousAsset);
      setPreviewUrl(previousPreviewUrl);
      setMessage(getListeningMediaErrorMessage(error));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove() {
    onChange(null);
    setAsset(null);
    setPreviewUrl("");
    setMessage(`Audio removed from this ${attachmentLabel}. Save to confirm the change.`);
    if (localPreviewRef.current) {
      URL.revokeObjectURL(localPreviewRef.current);
      localPreviewRef.current = null;
    }
  }

  return (
    <fieldset disabled={disabled || uploading} className="space-y-3">
      <legend className="text-sm font-semibold text-slate-800">Audio</legend>
      <p className="text-xs leading-5 text-slate-500">Upload one MP3 file, up to 25 MB. Audio remains a private draft until the publication workflow completes.</p>
      <input
        ref={inputRef}
        type="file"
        accept="audio/mpeg,.mp3"
        className="sr-only"
        aria-label={audioAssetId ? "Choose replacement MP3 audio" : "Choose MP3 audio"}
        onChange={(event) => void chooseFile(event.target.files?.[0])}
      />
      <div className="flex flex-wrap gap-2">
        <Button type={audioAssetId ? listeningControlTypes.replace : listeningControlTypes.upload} variant="secondary" disabled={disabled || uploading} onClick={() => inputRef.current?.click()}>
          {audioAssetId ? "Replace audio" : "Upload audio"}
        </Button>
        {audioAssetId && (
          <Button type={listeningControlTypes.remove} variant="danger" disabled={disabled || uploading} onClick={remove}>
            Remove audio
          </Button>
        )}
      </div>
      {uploading && <progress aria-label="Uploading audio" className="h-2 w-full overflow-hidden rounded" />}
      {(audioAssetId || uploading) && previewUrl && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 break-words text-xs font-semibold text-slate-600">{asset?.filename ?? "Selected MP3 preview"}</p>
          <audio controls preload="metadata" src={previewUrl} className="w-full">Your browser does not support audio playback.</audio>
        </div>
      )}
      {message && <p role={message.includes("could not") ? "alert" : "status"} aria-live="polite" className="text-sm text-slate-600">{message}</p>}
      {requiredForPublication && !audioAssetId && !uploading && <p className="text-sm text-amber-700">Add audio before publishing this lesson.</p>}
    </fieldset>
  );
}
