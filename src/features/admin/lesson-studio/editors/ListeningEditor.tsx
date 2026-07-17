import { useEffect, useState } from "react";

import {
  listListeningItems,
  listDraftAudioAssets,
  saveListeningItem,
  type DraftAudioAsset,
} from "../services/activityContentService";
import type { ListeningItem } from "../types";

export default function ListeningEditor({
  activityId,
  editable,
}: {
  activityId: number;
  editable: boolean;
}) {
  const [items, setItems] = useState<ListeningItem[]>(
    []
  );
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
      listListeningItems(activityId),
      listDraftAudioAssets(),
    ])
      .then(
        ([value, audioAssets]) => {
          if (active) {
            setItems(value);
            setAssets(audioAssets);
          }
        }
      )
      .catch(
        (error: unknown) =>
          active &&
          setMessage(
            error instanceof Error
              ? error.message
              : "Unable to load listening content."
          )
      );
    return () => {
      active = false;
    };
  }, [activityId]);

  async function save(item: ListeningItem) {
    setBusy(true);
    setMessage(null);
    try {
      const saved = await saveListeningItem(
        item,
        activityId
      );
      setItems((current) =>
        current.map((value) =>
          value.id === saved.id ? saved : value
        )
      );
      setMessage("Listening content saved.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save listening content."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-slate-950">
        Listening content
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Audio must already exist as a managed media
        asset. Browser publication is intentionally
        unavailable.
      </p>
      {message && (
        <p role="status" className="mt-3 text-sm text-slate-600">
          {message}
        </p>
      )}
      {items.map((item) => (
        <div key={item.id} className="mt-5 space-y-4">
          <Field label="Item title">
            <input
              value={item.title}
              disabled={!editable || busy}
              onChange={(event) =>
                setItems((current) =>
                  current.map((value) =>
                    value.id === item.id
                      ? {
                          ...value,
                          title: event.target.value,
                        }
                      : value
                  )
                )
              }
              className="field"
            />
          </Field>
          <Field label="Instructions">
            <textarea
              value={item.instructions ?? ""}
              disabled={!editable || busy}
              onChange={(event) =>
                setItems((current) =>
                  current.map((value) =>
                    value.id === item.id
                      ? {
                          ...value,
                          instructions: event.target.value,
                        }
                      : value
                  )
                )
              }
              className="field"
            />
          </Field>
          <Field label="Transcript">
            <textarea
              rows={6}
              value={item.transcript ?? ""}
              disabled={!editable || busy}
              onChange={(event) =>
                setItems((current) =>
                  current.map((value) =>
                    value.id === item.id
                      ? {
                          ...value,
                          transcript: event.target.value,
                        }
                      : value
                  )
                )
              }
              className="field"
            />
          </Field>
          <Field label="Draft audio asset (optional)">
            <select
              value={item.audioAssetId ?? ""}
              disabled={!editable || busy}
              onChange={(event) =>
                setItems((current) =>
                  current.map((value) =>
                    value.id === item.id
                      ? {
                          ...value,
                          audioAssetId:
                            event.target.value || null,
                        }
                      : value
                  )
                )
              }
              className="field"
            >
              <option value="">No media selected</option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.filename}
                </option>
              ))}
            </select>
          </Field>
          {editable && (
            <button
              type="button"
              disabled={busy || !item.title.trim()}
              onClick={() => void save(item)}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            >
              {busy ? "Saving…" : "Save listening"}
            </button>
          )}
        </div>
      ))}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      {children}
    </label>
  );
}
