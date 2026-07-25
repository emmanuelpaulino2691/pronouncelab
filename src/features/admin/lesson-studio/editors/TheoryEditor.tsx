import { useEffect, useState } from "react";

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
import { uploadDraftLearnAudio, uploadDraftLearnImage } from "../services/learnMediaService";

const blockTypes: TheoryBlockType[] = learnBlockRegistry.map((block) => block.type);

type Props = {
  activityId: number;
  editable: boolean;
};

export default function TheoryEditor({
  activityId,
  editable,
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
  const [uploading, setUploading] = useState<number | null>(null);

  async function refresh() {
    setBlocks(await listTheoryBlocks(activityId));
  }

  useEffect(() => {
    let active = true;
    void listTheoryBlocks(activityId)
      .then((value) => active && setBlocks(value))
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
      setPreviewUrls((current) => ({ ...current, [block.id]: result.previewUrl }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Media upload failed. Try again.");
    } finally { setUploading(null); }
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
        {editable && (
          <select
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
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="mt-5 space-y-4">
        {blocks.map((block, index) => (
          <div
            key={block.id}
            className="rounded-xl border border-slate-200 p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                {getLearnBlockDefinition(block.blockType).title}
              </span>
              {editable && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy || index === 0}
                    onClick={() => {
                      const ids = blocks.map(
                        (item) => item.id
                      );
                      [ids[index - 1], ids[index]] = [
                        ids[index],
                        ids[index - 1],
                      ];
                      void run(() =>
                        reorderTheoryBlocks(
                          activityId,
                          ids
                        )
                      );
                    }}
                    className="text-xs font-semibold disabled:opacity-30"
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    disabled={
                      busy || index === blocks.length - 1
                    }
                    onClick={() => {
                      const ids = blocks.map(
                        (item) => item.id
                      );
                      [ids[index], ids[index + 1]] = [
                        ids[index + 1],
                        ids[index],
                      ];
                      void run(() =>
                        reorderTheoryBlocks(
                          activityId,
                          ids
                        )
                      );
                    }}
                    className="text-xs font-semibold disabled:opacity-30"
                  >
                    Down
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      if ((block.text?.trim() || block.mediaAssetId) && !window.confirm("Delete this populated block?")) return;
                      void run(() => deleteTheoryBlock(block.id, activityId));
                    }}
                    className="text-xs font-semibold text-red-700"
                  >
                    Delete
                  </button>
                  <button type="button" disabled={busy} onClick={() => void run(() => duplicateTheoryBlock(block, activityId))} className="text-xs font-semibold">Duplicate</button>
                </div>
              )}
            </div>
            <button type="button" className="mt-2 text-xs font-semibold text-slate-600" onClick={() => setCollapsed((current) => { const next = new Set(current); if (next.has(block.id)) next.delete(block.id); else next.add(block.id); return next; })}>{collapsed.has(block.id) ? "Expand block" : "Collapse block"}</button>
            {!collapsed.has(block.id) && <textarea
              aria-label={`Content for block ${index + 1}`}
              value={block.text ?? ""}
              disabled={!editable || busy}
              rows={block.blockType === "paragraph" ? 4 : 2}
              onChange={(event) =>
                setBlocks((current) =>
                  current.map((item) =>
                    item.id === block.id
                      ? {
                          ...item,
                          text: event.target.value,
                        }
                      : item
                  )
                )
              }
              className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
            />}
            {!collapsed.has(block.id) && (block.blockType === "image" || block.blockType === "audio") && (
              <div className="mt-3 rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-600">
                <input id={`learn-media-${block.id}`} className="sr-only" type="file" accept={block.blockType === "image" ? "image/*" : "audio/*"} disabled={!editable || uploading === block.id} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadMedia(block, file); event.currentTarget.value = ""; }} />
                <label htmlFor={`learn-media-${block.id}`} className="inline-flex min-h-10 cursor-pointer items-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white">{uploading === block.id ? "Uploading..." : block.mediaAssetId ? `Replace ${block.blockType === "image" ? "Image" : "Audio"}` : `Select ${block.blockType === "image" ? "Image" : "Audio"}`}</label>
                {block.mediaAssetId && <button type="button" className="ml-2 text-sm font-semibold text-red-700" disabled={uploading === block.id} onClick={() => { setBlocks((current) => current.map((item) => item.id === block.id ? { ...item, mediaAssetId: null } : item)); setPreviewUrls((current) => { const next = { ...current }; delete next[block.id]; return next; }); }}>Remove {block.blockType === "image" ? "Image" : "Audio"}</button>}
                {previewUrls[block.id] && block.blockType === "image" && <img src={previewUrls[block.id]} alt={block.altText ?? "Learn block preview"} className="mt-3 max-h-48 rounded-lg object-contain" />}
                {previewUrls[block.id] && block.blockType === "audio" && <audio controls src={previewUrls[block.id]} className="mt-3 w-full" />}
                {!block.mediaAssetId && <p className="mt-2">Media not configured. Select a file to add it.</p>}
                {block.blockType === "image" && <input aria-label="Alternative text" className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Alternative text" value={block.altText ?? ""} disabled={!editable || busy} onChange={(event) => setBlocks((current) => current.map((item) => item.id === block.id ? { ...item, altText: event.target.value } : item))} />}
              </div>
            )}
            {!collapsed.has(block.id) && editable && (
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void run(() =>
                    saveTheoryBlock(
                      blocks.find(
                        (item) => item.id === block.id
                      ) ?? block,
                      activityId
                    )
                  )
                }
                className="mt-3 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
              >
                Save block
              </button>
            )}
            {collapsed.has(block.id) && <p className="mt-2 truncate text-sm text-slate-600">{block.text || "Empty block"}</p>}
            {validateLearnBlock(block) && <p className="mt-2 text-xs text-amber-700">{validateLearnBlock(block)}</p>}
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-xl bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Author preview
        </p>
        {blocks.map((block) => (
          <div key={block.id} className="mt-3">
            {block.blockType === "heading" ? (
              <h3 className="text-xl font-bold">
                {block.text || "Untitled heading"}
              </h3>
            ) : (
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {block.text || "Empty block"}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
