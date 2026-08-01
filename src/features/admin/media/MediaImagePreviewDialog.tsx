import { useState } from "react";
import type { MediaAssetSummary } from "../../../domain/media";
import { Button, Dialog } from "../ui";
import {
  imagePreviewAlt,
  imagePreviewTitle,
  mediaImagePreviewDialogClassName,
  mediaImagePreviewImageClassName,
  nextImagePreviewState,
  type ImagePreviewState,
} from "./mediaImagePreview";

type Props = {
  asset: MediaAssetSummary;
  previewUrl: string;
  onClose: () => void;
  onRetry: () => Promise<string>;
};

export default function MediaImagePreviewDialog({ asset, previewUrl, onClose, onRetry }: Props) {
  const [displayUrl, setDisplayUrl] = useState(previewUrl);
  const [state, setState] = useState<ImagePreviewState>(previewUrl ? "ready" : "error");

  async function retry() {
    setState((current) => nextImagePreviewState(current, "retry"));
    const url = await onRetry();
    setDisplayUrl(url);
    setState((current) => nextImagePreviewState(current, url ? "loaded" : "failed"));
  }

  const failed = state === "error";

  return (
    <Dialog
      isOpen
      onClose={onClose}
      title={imagePreviewTitle(asset.filename)}
      description="Inspect this image at the largest safe size."
      preventClose={state === "retrying"}
      className={mediaImagePreviewDialogClassName}
      footer={
        <>
          {failed && <Button type="button" variant="secondary" onClick={() => void retry()}>Try again</Button>}
          <Button type="button" onClick={onClose} disabled={state === "retrying"} aria-label={`Close image preview for ${asset.filename}`}>Close</Button>
        </>
      }
    >
      {failed ? (
        <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Image preview could not be loaded.</div>
      ) : (
        <div className="min-w-0 overflow-x-hidden">
          <img
            src={displayUrl}
            alt={imagePreviewAlt(asset.filename)}
            className={mediaImagePreviewImageClassName}
            onLoad={() => setState((current) => nextImagePreviewState(current, "loaded"))}
            onError={() => setState((current) => nextImagePreviewState(current, "failed"))}
          />
        </div>
      )}
      <dl className="mt-5 grid gap-3 border-t border-slate-200 pt-4 text-sm sm:grid-cols-3">
        <div className="min-w-0"><dt className="font-semibold text-slate-700">Filename</dt><dd className="mt-1 break-words text-slate-600">{asset.filename}</dd></div>
        <div className="min-w-0"><dt className="font-semibold text-slate-700">MIME type</dt><dd className="mt-1 break-all text-slate-600">{asset.mimeType}</dd></div>
        <div className="min-w-0"><dt className="font-semibold text-slate-700">Uploaded</dt><dd className="mt-1 text-slate-600">{new Date(asset.createdAt).toLocaleDateString()}</dd></div>
      </dl>
    </Dialog>
  );
}
