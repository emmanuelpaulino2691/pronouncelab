import { useEffect, useState } from "react";
import { resolveMediaAssetPreviewSafely, type MediaAssetSummary } from "../../../domain/media";
import { Button } from "../ui";
import MediaImagePreviewDialog from "./MediaImagePreviewDialog";
import { canOpenImagePreview, imagePreviewAlt } from "./mediaImagePreview";

type Props = { asset: MediaAssetSummary; selected?: boolean; onSelect?: (asset: MediaAssetSummary) => void; onOpen?: (asset: MediaAssetSummary) => void; onReplace?: (asset: MediaAssetSummary) => void; onDelete?: (asset: MediaAssetSummary) => void; readOnly?: boolean; allowImagePreview?: boolean };

export default function MediaAssetCard({ asset, selected = false, onSelect, onOpen, onReplace, onDelete, readOnly = false, allowImagePreview = true }: Props) {
  const [preview, setPreview] = useState(asset.previewUrl ?? "");
  const [previewFailed, setPreviewFailed] = useState(false);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);

  async function resolvePreview() {
    const result = await resolveMediaAssetPreviewSafely(asset);
    setPreview(result.url);
    setPreviewFailed(result.failed);
    return result.url;
  }

  useEffect(() => {
    if (asset.previewUrl) return;
    let active = true;
    void resolveMediaAssetPreviewSafely(asset).then((result) => { if (active) { setPreview(result.url); setPreviewFailed(result.failed); } });
    return () => { active = false; };
  }, [asset]);

  const imagePreviewEnabled = canOpenImagePreview(asset.kind, allowImagePreview);
  const thumbnail = <div className="grid aspect-[16/9] place-items-center overflow-hidden rounded-xl bg-slate-100">{asset.kind === "image" && preview ? <img src={preview} alt={imagePreviewEnabled ? imagePreviewAlt(asset.filename) : ""} className="h-full w-full object-cover" /> : <span aria-hidden="true" className="text-3xl">{asset.kind === "audio" ? "♫" : "▧"}</span>}</div>;

  return <>
    <article aria-label={`${asset.kind === "image" ? "Image" : "Audio"}: ${asset.filename}`} aria-selected={onSelect ? selected : undefined} className={`min-w-0 rounded-2xl border bg-white p-4 shadow-sm ${selected ? "border-blue-600 ring-2 ring-blue-100" : "border-slate-200"}`}>
      {imagePreviewEnabled ? <button type="button" aria-label={`Open image ${asset.filename}`} onClick={() => setImagePreviewOpen(true)} className="block w-full rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">{thumbnail}</button> : thumbnail}
      {asset.kind === "audio" && preview && <audio controls preload="metadata" src={preview} className="mt-3 w-full">Your browser does not support audio playback.</audio>}
      {previewFailed && <p role="status" className="mt-3 text-xs text-amber-700">This file preview could not be generated.</p>}
      <h3 className="mt-3 break-words text-sm font-bold text-slate-950">{asset.filename}</h3>
      <dl className="mt-2 space-y-1 text-xs text-slate-600"><div className="flex justify-between gap-3"><dt>Kind</dt><dd>{asset.kind === "image" ? "Image" : "Audio"}</dd></div><div className="flex justify-between gap-3"><dt>MIME type</dt><dd className="break-all text-right">{asset.mimeType}</dd></div><div className="flex justify-between gap-3"><dt>Uploaded</dt><dd>{new Date(asset.createdAt).toLocaleDateString()}</dd></div>{asset.usageCount !== undefined && <div className="flex justify-between gap-3"><dt>Uses</dt><dd>{asset.usageCount}</dd></div>}</dl>
      <div className="mt-4 flex flex-wrap gap-2">{onSelect && <Button type="button" variant="secondary" aria-pressed={selected} onClick={() => onSelect(asset)}>{selected ? "Selected" : "Select"}</Button>}{imagePreviewEnabled && <Button type="button" variant="ghost" onClick={() => setImagePreviewOpen(true)}>Open image</Button>}{onOpen && !imagePreviewEnabled && <Button type="button" variant="ghost" onClick={() => onOpen(asset)}>Open</Button>}{!readOnly && onReplace && <Button type="button" variant="ghost" onClick={() => onReplace(asset)}>Replace</Button>}{!readOnly && onDelete && <Button type="button" variant="danger" onClick={() => onDelete(asset)}>Delete</Button>}<Button type="button" variant="ghost" disabled title="Copy ID is not exposed until management operations are finalized.">Copy ID</Button></div>
    </article>
    {imagePreviewOpen && <MediaImagePreviewDialog asset={asset} previewUrl={preview} onClose={() => setImagePreviewOpen(false)} onRetry={resolvePreview} />}
  </>;
}
