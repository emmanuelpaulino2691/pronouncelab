import { useEffect, useMemo, useRef, useState } from "react";

import {
  addTheoryBlock,
  duplicateTheoryBlock,
  deleteTheoryBlock,
  listTheoryBlocks,
  reorderTheoryBlocks,
  saveTheoryBlock,
} from "../services/activityContentService";
import type {
  TheoryBlock,
  TheoryBlockType,
} from "../types";
import { learnBlockRegistry, getLearnBlockDefinition } from "../learnBlockRegistry";
import { validateLearnBlock } from "../learnBlockState";
import { getLearnMediaAsset, uploadDraftLearnAudio, uploadDraftLearnImage } from "../services/learnMediaService";
import { canMoveLearnBlock, deletionFocusTarget, insertDuplicatedLearnBlock, isLearnBlockPopulated, learnBlockSummary, removeLearnBlock, reorderLearnBlocks, toggleLearnBlockCollapsed } from "../learnBlockState";
import { ConfirmDeleteDialog } from "../../ui";
import type { ActivitySectionCollapseController } from "../studioViewState";
import MediaPicker from "../../media/MediaPicker";

const blockTypes: TheoryBlockType[] = learnBlockRegistry.map((block) => block.type);

type Props = {
  activityId: number;
  editable: boolean;
  onDirtyChange: (dirty: boolean) => void;
  onSectionControllerChange?: (controller: ActivitySectionCollapseController | null) => void;
};

export default function TheoryEditor({
  activityId,
  editable,
  onDirtyChange,
  onSectionControllerChange,
}: Props) {
  const [blocks, setBlocks] = useState<TheoryBlock[]>(
    []
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    null
  );
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const [previewUrls, setPreviewUrls] = useState<Record<number, string>>({});
  const [mediaFilenames, setMediaFilenames] = useState<Record<number, string>>({});
  const [previewFailures, setPreviewFailures] = useState<Set<number>>(new Set());
  const [uploading, setUploading] = useState<number | null>(null);
  const [dirtyIds, setDirtyIds] = useState<Set<number>>(new Set());
  const [orderDirty, setOrderDirty] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<TheoryBlock | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [libraryPicker, setLibraryPicker] = useState<{ blockId: number; kind: "image" | "audio" } | null>(null);
  const blockRefs = useRef(new Map<number, HTMLDivElement>());
  const addBlockRef = useRef<HTMLSelectElement>(null);
  const reportedDirty = useRef(false);
  const mediaSignature = useMemo(() => blocks
    .filter((block) => block.blockType === "image" || block.blockType === "audio")
    .map((block) => `${block.id}:${block.blockType}:${block.mediaAssetId ?? ""}`)
    .join("|"), [blocks]);

  async function refresh() {
    const loaded = await listTheoryBlocks(activityId);
    setBlocks(loaded);
    setDirtyIds(new Set());
    setOrderDirty(false);
  }

  useEffect(() => {
    const dirty = dirtyIds.size > 0 || orderDirty;
    if (reportedDirty.current !== dirty) {
      reportedDirty.current = dirty;
      onDirtyChange(dirty);
    }
  }, [dirtyIds, onDirtyChange, orderDirty]);

  useEffect(() => {
    let active = true;
    void listTheoryBlocks(activityId)
      .then((value) => { if (active) setBlocks(value); })
      .catch(
        (reason: unknown) =>
          active &&
          setError(
            reason instanceof Error
              ? reason.message
              : "Unable to load theory."
          )
      );
    return () => {
      active = false;
    };
  }, [activityId]);

  useEffect(() => {
    let active = true;
    const mediaBlocks = blocks.filter(
      (block) => (block.blockType === "image" || block.blockType === "audio") && block.mediaAssetId
    );
    for (const block of mediaBlocks) {
      void getLearnMediaAsset(block.mediaAssetId!, block.blockType as "image" | "audio").then(
        (asset) => {
          if (!active) return;
          setPreviewUrls((current) => ({ ...current, [block.id]: asset.previewUrl }));
          setMediaFilenames((current) => ({ ...current, [block.id]: asset.filename }));
          setPreviewFailures((current) => { const next = new Set(current); next.delete(block.id); return next; });
        },
        () => {
          if (!active) return;
          setPreviewFailures((current) => new Set(current).add(block.id));
        }
      );
    }
    return () => { active = false; };
    // The stable media signature changes only when a saved reference changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaSignature]);

  const blockIds = useMemo(() => blocks.map((block) => block.id), [blocks]);
  useEffect(() => {
    if (!onSectionControllerChange) return;
    onSectionControllerChange({ canCollapse: blockIds.length > 0, supportsSectionCollapse: true, sectionCount: blockIds.length, collapsedSectionCount: blockIds.filter((id) => collapsed.has(id)).length, disabledReason: blockIds.length ? undefined : "This Learn activity has no blocks to collapse.", collapseAll: () => setCollapsed(new Set(blockIds)), expandAll: () => setCollapsed(new Set()) });
    return () => onSectionControllerChange(null);
  }, [blockIds, collapsed, onSectionControllerChange]);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await refresh();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to save theory."
      );
    } finally {
      setBusy(false);
    }
  }

  async function uploadMedia(block: TheoryBlock, file: File) {
    setUploading(block.id); setError(null);
    try {
      const result = block.blockType === "image"
        ? await uploadDraftLearnImage(activityId, file)
        : await uploadDraftLearnAudio(activityId, file);
      setBlocks((current) => current.map((item) => item.id === block.id ? { ...item, mediaAssetId: result.id } : item));
      setDirtyIds((current) => new Set(current).add(block.id));
      setPreviewUrls((current) => ({ ...current, [block.id]: result.previewUrl }));
      setMediaFilenames((current) => ({ ...current, [block.id]: result.filename }));
      setPreviewFailures((current) => { const next = new Set(current); next.delete(block.id); return next; });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Media upload failed. Try again.");
    } finally { setUploading(null); }
  }

  function updateBlock(blockId: number, update: Partial<TheoryBlock>) {
    setBlocks((current) => current.map((block) => block.id === blockId ? { ...block, ...update } : block));
    setDirtyIds((current) => new Set(current).add(blockId));
  }

  function moveBlock(from: number, to: number) {
    if (from === to) return;
    setBlocks((current) => reorderLearnBlocks(current, from, to));
    setOrderDirty(true);
    const moved = blocks[from];
    if (moved) setAnnouncement(`${getLearnBlockDefinition(moved.blockType).title} moved to position ${to + 1}.`);
  }

  async function saveOrder() {
    setBusy(true); setError(null);
    const orderedIds = blocks.map((block) => block.id);
    try {
      await reorderTheoryBlocks(activityId, orderedIds);
      setOrderDirty(false);
      setAnnouncement("Block order saved.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to save block order."); }
    finally { setBusy(false); }
  }

  async function saveBlock(block: TheoryBlock) {
    setBusy(true); setError(null);
    try {
      const saved = await saveTheoryBlock(block, activityId);
      setBlocks((current) => current.map((item) => item.id === saved.id ? saved : item));
      setDirtyIds((current) => { const next = new Set(current); next.delete(saved.id); return next; });
      setAnnouncement(`${getLearnBlockDefinition(saved.blockType).title} saved.`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to save block."); }
    finally { setBusy(false); }
  }

  async function duplicateBlock(block: TheoryBlock) {
    const sourceWasDirty = dirtyIds.has(block.id);
    setBusy(true); setError(null); setDirtyIds((current) => new Set(current).add(block.id));
    try {
      const created = await duplicateTheoryBlock(block, activityId, blocks.length);
      const next = insertDuplicatedLearnBlock(blocks, block.id, created);
      await reorderTheoryBlocks(activityId, next.map((item) => item.id));
      setBlocks(next);
      setDirtyIds((current) => { const nextDirty = new Set(current); nextDirty.delete(created.id); if (!sourceWasDirty) nextDirty.delete(block.id); return nextDirty; });
      setOrderDirty(false);
      setAnnouncement(`${getLearnBlockDefinition(block.blockType).title} duplicated.`);
      window.requestAnimationFrame(() => blockRefs.current.get(created.id)?.focus());
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to duplicate block."); }
    finally { setBusy(false); }
  }

  async function confirmDelete(block: TheoryBlock) {
    const target = deletionFocusTarget(blocks, block.id);
    const previous = blocks;
    const next = removeLearnBlock(blocks, block.id);
    setBlocks(next);
    setBusy(true); setError(null);
    try {
      await deleteTheoryBlock(block.id, activityId);
      if (next.length) await reorderTheoryBlocks(activityId, next.map((item) => item.id));
      setBlocks(next); setDeleteCandidate(null);
      setDirtyIds((current) => { const nextDirty = new Set(current); nextDirty.delete(block.id); return nextDirty; });
      setOrderDirty(false);
      setAnnouncement(`${getLearnBlockDefinition(block.blockType).title} deleted.`);
      window.requestAnimationFrame(() => target === "add" ? addBlockRef.current?.focus() : blockRefs.current.get(target)?.focus());
    } catch (reason) { setBlocks(previous); setError(reason instanceof Error ? reason.message : "Unable to delete block."); }
    finally { setBusy(false); }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-950">
            Learning content
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Build the lesson one focused block at a time.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
        {editable && (
          <select
            ref={addBlockRef}
            aria-label="Add theory block"
            disabled={busy}
            defaultValue=""
            onChange={(event) => {
              const value = event.target
                .value as TheoryBlockType;
              if (value) {
                void run(() =>
                  addTheoryBlock(
                    activityId,
                    blocks.length === 0
                      ? 0
                      : Math.max(
                          ...blocks.map(
                            (block) => block.position
                          )
                        ) + 1,
                    value
                  )
                );
                event.target.value = "";
              }
            }}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="" disabled>
              Add block…
            </option>
            {blockTypes.map((type) => (
              <option key={type} value={type}>
                {getLearnBlockDefinition(type).title}
              </option>
            ))}
          </select>
        )}
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      )}
      <p aria-live="polite" className="sr-only">{announcement}</p>
      <div className="mt-5">
      <div className="space-y-4">
        {blocks.map((block, index) => (
          <div
            key={block.id}
            ref={(node) => { if (node) blockRefs.current.set(block.id, node); else blockRefs.current.delete(block.id); }}
            tabIndex={-1}
            onDragOver={(event) => { if (draggedId !== null) { event.preventDefault(); event.dataTransfer.dropEffect = "move"; } }}
            onDrop={(event) => { event.preventDefault(); const from = blocks.findIndex((item) => item.id === draggedId); if (from >= 0) moveBlock(from, index); setDraggedId(null); }}
            onDragEnd={() => setDraggedId(null)}
            className={`rounded-xl border p-4 ${draggedId === block.id ? "border-blue-400 bg-blue-50/40 opacity-70" : "border-slate-200"}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                {getLearnBlockDefinition(block.blockType).title}
              </span>
              {editable && (
                <div className="flex flex-wrap justify-end gap-2">
                  <button type="button" draggable={editable && !busy} onDragStart={(event) => { setDraggedId(block.id); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", String(block.id)); }} aria-label={`Drag ${getLearnBlockDefinition(block.blockType).title} block`} title="Drag to reorder" className="cursor-grab touch-manipulation select-none rounded-md px-2 py-1 text-base text-slate-500 active:cursor-grabbing">⋮⋮</button>
                  <button
                    type="button"
                    aria-label={`Move ${getLearnBlockDefinition(block.blockType).title} block up`}
                    disabled={busy || !canMoveLearnBlock(index, -1, blocks.length)}
                    onClick={() => { moveBlock(index, index - 1); window.requestAnimationFrame(() => blockRefs.current.get(block.id)?.focus()); }}
                    className="min-h-9 rounded-md px-2 text-xs font-semibold disabled:opacity-30"
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${getLearnBlockDefinition(block.blockType).title} block down`}
                    disabled={busy || !canMoveLearnBlock(index, 1, blocks.length)}
                    onClick={() => { moveBlock(index, index + 1); window.requestAnimationFrame(() => blockRefs.current.get(block.id)?.focus()); }}
                    className="min-h-9 rounded-md px-2 text-xs font-semibold disabled:opacity-30"
                  >
                    Down
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    aria-label={`Delete ${getLearnBlockDefinition(block.blockType).title} block`}
                    onClick={() => isLearnBlockPopulated(block) ? setDeleteCandidate(block) : void confirmDelete(block)}
                    className="min-h-9 rounded-md px-2 text-xs font-semibold text-red-700"
                  >
                    Delete
                  </button>
                  <button type="button" aria-label={`Duplicate ${getLearnBlockDefinition(block.blockType).title} block`} disabled={busy} onClick={() => void duplicateBlock(block)} className="min-h-9 rounded-md px-2 text-xs font-semibold">Duplicate</button>
                </div>
              )}
            </div>
            <button type="button" aria-expanded={!collapsed.has(block.id)} className="mt-2 min-h-9 text-xs font-semibold text-slate-600" onClick={() => setCollapsed((current) => toggleLearnBlockCollapsed(current, block.id))}>{collapsed.has(block.id) ? "Expand block" : "Collapse block"}</button>
            {!collapsed.has(block.id) && block.blockType !== "audio" && <textarea
              aria-label={`Content for block ${index + 1}`}
              value={block.text ?? ""}
              disabled={!editable || busy}
              rows={block.blockType === "paragraph" ? 4 : 2}
              onChange={(event) => updateBlock(block.id, { text: event.target.value })}
              className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
            />}
            {!collapsed.has(block.id) && (block.blockType === "image" || block.blockType === "audio") && (
              <div className="mt-3 rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-600">
                <input id={`learn-media-${block.id}`} className="sr-only" type="file" accept={block.blockType === "image" ? "image/*" : "audio/*"} disabled={!editable || uploading === block.id} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadMedia(block, file); event.currentTarget.value = ""; }} />
                <label htmlFor={`learn-media-${block.id}`} className="inline-flex min-h-10 cursor-pointer items-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white">{uploading === block.id ? "Uploading..." : block.mediaAssetId ? `Replace ${block.blockType === "image" ? "Image" : "Audio"}` : `Select ${block.blockType === "image" ? "Image" : "Audio"}`}</label>
                <button type="button" disabled={!editable || uploading === block.id} onClick={() => setLibraryPicker({ blockId: block.id, kind: block.blockType as "image" | "audio" })} className="ml-2 min-h-10 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700">Choose from Library</button>
                {block.mediaAssetId && <button type="button" className="ml-2 min-h-10 text-sm font-semibold text-red-700" disabled={uploading === block.id} onClick={() => { updateBlock(block.id, { mediaAssetId: null }); setPreviewUrls((current) => { const next = { ...current }; delete next[block.id]; return next; }); setMediaFilenames((current) => { const next = { ...current }; delete next[block.id]; return next; }); setPreviewFailures((current) => { const next = new Set(current); next.delete(block.id); return next; }); }}>Remove {block.blockType === "image" ? "Image" : "Audio"}</button>}
                {previewUrls[block.id] && block.blockType === "image" && <img src={previewUrls[block.id]} alt={block.altText ?? "Learn block preview"} className="mt-3 max-h-48 rounded-lg object-contain" />}
                {previewUrls[block.id] && block.blockType === "audio" && <audio controls src={previewUrls[block.id]} className="mt-3 w-full" />}
                {previewFailures.has(block.id) && <p role="status" className="mt-2 text-amber-700">Media remains saved, but its secure preview could not be loaded. Retry by refreshing this page.</p>}
                {!block.mediaAssetId && <p className="mt-2">Media not configured. Select a file to add it.</p>}
                {block.blockType === "image" && <input aria-label="Alternative text" className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Alternative text" value={block.altText ?? ""} disabled={!editable || busy} onChange={(event) => updateBlock(block.id, { altText: event.target.value })} />}
                {block.blockType === "audio" && <><input aria-label="Audio label" className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Audio label" value={block.title ?? ""} disabled={!editable || busy} onChange={(event) => updateBlock(block.id, { title: event.target.value })} /><textarea aria-label="Audio transcript" className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Optional transcript" rows={3} value={block.text ?? ""} disabled={!editable || busy} onChange={(event) => updateBlock(block.id, { text: event.target.value })} /></>}
              </div>
            )}
            {!collapsed.has(block.id) && editable && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void saveBlock(blocks.find((item) => item.id === block.id) ?? block)}
                className="mt-3 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
              >
                Save block
              </button>
            )}
            {collapsed.has(block.id) && <div className="mt-2"><p className="truncate text-sm text-slate-600"><span className="font-semibold">{getLearnBlockDefinition(block.blockType).title}:</span> {learnBlockSummary(block, mediaFilenames[block.id])}</p>{validateLearnBlock(block) && <p className="mt-1 text-xs text-amber-700">{validateLearnBlock(block)}</p>}</div>}
            {!collapsed.has(block.id) && validateLearnBlock(block) && <p className="mt-2 text-xs text-amber-700">{validateLearnBlock(block)}</p>}
          </div>
        ))}
        {orderDirty && editable && <div className="sticky bottom-4 z-10 rounded-xl border border-blue-200 bg-white p-3 shadow-lg"><button type="button" disabled={busy} onClick={() => void saveOrder()} className="min-h-11 rounded-lg bg-blue-600 px-4 font-semibold text-white">Save block order</button></div>}
      </div>
      </div>
      <ConfirmDeleteDialog isOpen={deleteCandidate !== null} title="Delete Learn block?" description={deleteCandidate ? `Delete this populated ${getLearnBlockDefinition(deleteCandidate.blockType).title} block? Shared media files will remain in the media library.` : "Delete this block?"} isDeleting={busy} errorMessage={null} onCancel={() => setDeleteCandidate(null)} onConfirm={() => { if (deleteCandidate) void confirmDelete(deleteCandidate); }} />
      <MediaPicker open={libraryPicker !== null} kind={libraryPicker?.kind ?? "image"} selectedMediaAssetId={libraryPicker ? blocks.find((block) => block.id === libraryPicker.blockId)?.mediaAssetId : null} onClose={() => setLibraryPicker(null)} onSelect={(asset) => { if (libraryPicker) updateBlock(libraryPicker.blockId, { mediaAssetId: asset.id }); setLibraryPicker(null); }} title={`Choose ${libraryPicker?.kind ?? "media"} from Library`} />
    </section>
  );
}
