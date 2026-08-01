import { useEffect, useRef, useState } from "react";
import { mediaLibraryUnavailableMessage, unavailableMediaLibraryService, type MediaAssetSummary, type MediaKind } from "../../../domain/media";
import { Button, Dialog, TextInput } from "../ui";
import MediaAssetCard from "./MediaAssetCard";

export type MediaPickerProps = { open: boolean; kind: MediaKind; selectedMediaAssetId?: string | null; onSelect: (asset: MediaAssetSummary) => void; onClose: () => void; title?: string; allowUpload?: boolean };

export default function MediaPicker({ open, kind, selectedMediaAssetId, onSelect, onClose, title = "Choose from Media Library", allowUpload = false }: MediaPickerProps) {
  const searchRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<MediaAssetSummary[]>([]);
  const [selected, setSelected] = useState(selectedMediaAssetId ?? null);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable" | "error">("loading");
  useEffect(() => {
    if (!open) return;
    let active = true;
    void unavailableMediaLibraryService.listMedia({ kind, search, sort: "newest" }).then((result) => { if (active) { setItems(result.items); setStatus("ready"); } }, (error: unknown) => { if (active) setStatus(error instanceof Error && "code" in error ? "unavailable" : "error"); });
    return () => { active = false; };
  }, [kind, open, search]);
  const selectedAsset = items.find((asset) => asset.id === selected);
  return <Dialog isOpen={open} onClose={onClose} title={title} description={`Select an existing ${kind} asset. Direct upload remains available in the editor.`} initialFocusRef={searchRef} footer={<><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="button" disabled={!selectedAsset} onClick={() => { if (selectedAsset) onSelect(selectedAsset); }}>Select media</Button></>}>
    <label className="block text-sm font-semibold text-slate-800">Search library<TextInput ref={searchRef} value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${kind} filenames`} className="mt-2" /></label>
    {allowUpload && <p className="mt-3 text-sm text-slate-500">Library upload will become available after backend integration.</p>}
    {status === "loading" && <p role="status" className="mt-5 text-sm text-slate-600">Loading media…</p>}
    {status === "unavailable" && <p role="status" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{mediaLibraryUnavailableMessage}</p>}
    {status === "error" && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">The Media Library could not be loaded. Close the picker and try again.</p>}
    {status === "ready" && items.length === 0 && <p role="status" className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">No media matches your current filters.</p>}
    {items.length > 0 && <div className="mt-5 grid gap-4 sm:grid-cols-2">{items.map((asset) => <MediaAssetCard key={asset.id} asset={asset} selected={selected === asset.id} onSelect={(value) => setSelected(value.id)} readOnly />)}</div>}
  </Dialog>;
}
