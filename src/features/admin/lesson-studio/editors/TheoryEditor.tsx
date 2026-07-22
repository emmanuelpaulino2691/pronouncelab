import { useEffect, useState } from "react";

import {
  addTheoryBlock,
  deleteTheoryBlock,
  listTheoryBlocks,
  reorderTheoryBlocks,
  saveTheoryBlock,
} from "../services/activityContentService";
import type {
  TheoryBlock,
  TheoryBlockType,
} from "../types";

const blockTypes: TheoryBlockType[] = [
  "heading",
  "paragraph",
  "tip",
  "example",
  "image",
  "audio",
];

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

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-950">
            Learning content
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Structured blocks supported by the current
            schema.
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
                {type}
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
                {block.blockType}
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
                    onClick={() =>
                      void run(() =>
                        deleteTheoryBlock(
                          block.id,
                          activityId
                        )
                      )
                    }
                    className="text-xs font-semibold text-red-700"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
            <textarea
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
            />
            {editable && (
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
