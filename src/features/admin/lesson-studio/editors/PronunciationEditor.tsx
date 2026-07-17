import { useEffect, useState } from "react";

import {
  listPronunciationItems,
  listDraftAudioAssets,
  savePronunciationItem,
  type DraftAudioAsset,
} from "../services/activityContentService";
import type { PronunciationItem } from "../types";

export default function PronunciationEditor({
  activityId,
  editable,
}: {
  activityId: number;
  editable: boolean;
}) {
  const [items, setItems] = useState<
    PronunciationItem[]
  >([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<
    string | null
  >(null);
  const [assets, setAssets] = useState<
    DraftAudioAsset[]
  >([]);

  useEffect(() => {
    let active = true;
    void Promise.all([
      listPronunciationItems(activityId),
      listDraftAudioAssets(),
    ])
      .then(([value, audioAssets]) => {
        if (active) {
          setItems(value);
          setAssets(audioAssets);
        }
      })
      .catch(
        (error: unknown) =>
          active &&
          setMessage(
            error instanceof Error
              ? error.message
              : "Unable to load pronunciation content."
          )
      );
    return () => {
      active = false;
    };
  }, [activityId]);

  async function save(item: PronunciationItem) {
    setBusy(true);
    setMessage(null);
    try {
      const saved = await savePronunciationItem(
        item,
        activityId
      );
      setItems((current) =>
        current.map((value) =>
          value.id === saved.id ? saved : value
        )
      );
      setMessage("Pronunciation content saved.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save pronunciation content."
      );
    } finally {
      setBusy(false);
    }
  }

  const update = (
    id: number,
    patch: Partial<PronunciationItem>
  ) =>
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      )
    );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-slate-950">
        Pronunciation content
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        The current schema supports display text,
        instructions, and an existing audio reference.
        IPA, stress, and syllable fields are not stored
        yet.
      </p>
      {message && (
        <p role="status" className="mt-3 text-sm text-slate-600">
          {message}
        </p>
      )}
      {items.map((item) => (
        <div key={item.id} className="mt-5 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Item title
            <input
              className="field"
              value={item.title}
              disabled={!editable || busy}
              onChange={(event) =>
                update(item.id, {
                  title: event.target.value,
                })
              }
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Word or phrase
            <input
              className="field"
              value={item.displayText}
              disabled={!editable || busy}
              onChange={(event) =>
                update(item.id, {
                  displayText: event.target.value,
                })
              }
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Instructions / notes
            <textarea
              className="field"
              value={item.instructions ?? ""}
              disabled={!editable || busy}
              onChange={(event) =>
                update(item.id, {
                  instructions: event.target.value,
                })
              }
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Draft audio asset (optional)
            <select
              className="field"
              value={item.audioAssetId ?? ""}
              disabled={!editable || busy}
              onChange={(event) =>
                update(item.id, {
                  audioAssetId:
                    event.target.value || null,
                })
              }
            >
              <option value="">No media selected</option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.filename}
                </option>
              ))}
            </select>
          </label>
          {editable && (
            <button
              type="button"
              disabled={busy || !item.title.trim()}
              onClick={() => void save(item)}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            >
              {busy ? "Saving…" : "Save pronunciation"}
            </button>
          )}
        </div>
      ))}
    </section>
  );
}
