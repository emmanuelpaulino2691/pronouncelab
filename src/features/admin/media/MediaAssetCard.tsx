import { useEffect, useState } from "react";
import { resolveMediaAssetPreviewSafely, type MediaAssetSummary } from "../../../domain/media";
import { Button } from "../ui";

type Props = { asset: MediaAssetSummary; selected?: boolean; onSelect?: (asset: MediaAssetSummary) => void; onOpen?: (asset: MediaAssetSummary) => void; onReplace?: (asset: MediaAssetSummary) => void; onDelete?: (asset: MediaAssetSummary) => void; readOnly?: boolean };

export default function MediaAssetCard({ asset, selected = false, onSelect, onOpen, onReplace, onDelete, readOnly = false }: Props) {
  const [preview, setPreview] = useState(asset.previewUrl ?? "");
  const [previewFailed, setPreviewFailed] = useState(false);
  useEffect(() => {
    if (asset.previewUrl) return;
    let active = true;
    void resolveMediaAssetPreviewSafely(asset).then((result) => { if (active) { setPreview(result.url); setPreviewFailed(result.failed); } });
    return () => { active = false; };
  }, [asset]);
  return <article aria-label={`${asset.kind === "image" ? "Image" : "Audio"}: ${asset.filename}`} aria-selected={onSelect ? selected : undefined} className={`min-w-0 rounded-2xl border bg-white p-4 shadow-sm ${selected ? "border-blue-600 ring-2 ring-blue-100" : "border-slate-200"}`}>
    <div className="grid aspect-[16/9] place-items-center overflow-hidden rounded-xl bg-slate-100">{asset.kind === "image" && preview ? <img src={preview} alt="" className="h-full w-full object-cover" /> : <span aria-hidden="true" className="text-3xl">{asset.kind === "audio" ? "♫" : "▧"}</span>}</div>
    {asset.kind === "audio" && preview && <audio controls preload="metadata" src={preview} className="mt-3 w-full">Your browser does not support audio playback.</audio>}
    {previewFailed && <p role="status" className="mt-3 text-xs text-amber-700">This file preview could not be generated.</p>}
    <h3 className="mt-3 break-words text-sm font-bold text-slate-950">{asset.filename}</h3>
    <dl className="mt-2 space-y-1 text-xs text-slate-600"><div className="flex justify-between gap-3"><dt>Kind</dt><dd>{asset.kind === "image" ? "Image" : "Audio"}</dd></div><div className="flex justify-between gap-3"><dt>MIME type</dt><dd className="break-all text-right">{asset.mimeType}</dd></div><div className="flex justify-between gap-3"><dt>Uploaded</dt><dd>{new Date(asset.createdAt).toLocaleDateString()}</dd></div>{asset.usageCount !== undefined && <div className="flex justify-between gap-3"><dt>Uses</dt><dd>{asset.usageCount}</dd></div>}</dl>
    <div className="mt-4 flex flex-wrap gap-2">{onSelect && <Button type="button" variant="secondary" aria-pressed={selected} onClick={() => onSelect(asset)}>{selected ? "Selected" : "Select"}</Button>}{onOpen && <Button type="button" variant="ghost" onClick={() => onOpen(asset)}>Open</Button>}{!readOnly && onReplace && <Button type="button" variant="ghost" onClick={() => onReplace(asset)}>Replace</Button>}{!readOnly && onDelete && <Button type="button" variant="danger" onClick={() => onDelete(asset)}>Delete</Button>}<Button type="button" variant="ghost" disabled title="Copy ID is not exposed until management operations are finalized.">Copy ID</Button></div>
  </article>;
}
