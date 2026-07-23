import { useEffect, useState } from "react";

import { Alert, Button, Card, FormField, TextArea, TextInput } from "../../ui";
import ListeningAudioField from "../components/ListeningAudioField";
import {
  listeningControlTypes,
  preventListeningFormNavigation,
} from "../listeningControlTypes";
import {
  applyListeningAudioAsset,
  getListeningTranscriptError,
  maxListeningTranscriptLength,
} from "../listeningValidation";
import {
  listListeningItems,
  saveListeningItem,
} from "../services/activityContentService";
import type { ListeningItem } from "../types";

export default function ListeningEditor({
  activityId,
  editable,
  onDirtyChange,
}: {
  activityId: number;
  editable: boolean;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [items, setItems] = useState<ListeningItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [loadedActivityId, setLoadedActivityId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"success" | "error" | "info">("info");

  useEffect(() => {
    let active = true;
    void listListeningItems(activityId)
      .then((value) => { if (active) setItems(value); })
      .catch(() => {
        if (active) {
          setMessageTone("error");
          setMessage("We couldn’t load the listening content. Try reopening the activity.");
        }
      })
      .finally(() => { if (active) setLoadedActivityId(activityId); });
    return () => { active = false; };
  }, [activityId]);

  function patch(itemId: number, values: Partial<ListeningItem>) {
    onDirtyChange(true);
    setItems((current) => current.map((item) =>
      item.id === itemId ? { ...item, ...values } : item
    ));
  }

  async function save(item: ListeningItem) {
    if (busy) return;
    const transcriptError = getListeningTranscriptError(item.transcript);
    if (!item.title.trim() || transcriptError) {
      setMessageTone("error");
      setMessage(transcriptError || "Add an item title before saving.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const saved = await saveListeningItem(item, activityId);
      setItems((current) => current.map((value) => value.id === saved.id ? saved : value));
      onDirtyChange(false);
      setMessageTone("success");
      setMessage("Listening content saved.");
    } catch {
      setMessageTone("error");
      setMessage("The listening content could not be saved. Your changes are still here. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (loadedActivityId !== activityId) return <Card className="p-6" role="status">Loading listening content…</Card>;

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-950">Listening content</h2>
        <p className="mt-1 text-sm text-slate-600">Add the audio learners will hear and enter the transcript manually.</p>
      </div>
      {message && <Alert tone={messageTone}>{message}</Alert>}
      {items.length === 0 && <Alert>No listening item is available for this activity.</Alert>}
      {items.map((item) => {
        const transcriptError = getListeningTranscriptError(item.transcript);
        return (
          <form
            key={item.id}
            className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgb(15_23_42/0.05)] sm:p-6"
            onSubmit={(event) => {
              preventListeningFormNavigation(event);
              void save(item);
            }}
          >
            <FormField label="Item title" htmlFor={`listening-title-${item.id}`} required>
              <TextInput id={`listening-title-${item.id}`} value={item.title} disabled={!editable || busy} onChange={(event) => patch(item.id, { title: event.target.value })} />
            </FormField>
            <FormField label="Instructions (optional)" htmlFor={`listening-instructions-${item.id}`} hint="Give learners any guidance they need before listening.">
              <TextArea id={`listening-instructions-${item.id}`} value={item.instructions ?? ""} disabled={!editable || busy} onChange={(event) => patch(item.id, { instructions: event.target.value })} />
            </FormField>
            <ListeningAudioField activityId={activityId} audioAssetId={item.audioAssetId} disabled={!editable || busy} onChange={(audioAssetId) => {
              const updated = applyListeningAudioAsset(item, audioAssetId);
              patch(item.id, { audioAssetId: updated.audioAssetId });
            }} />
            <FormField label="Transcript" htmlFor={`listening-transcript-${item.id}`} hint="Paste or type the complete transcript. The transcript is entered manually and may be left empty." error={transcriptError || undefined}>
              <TextArea
                id={`listening-transcript-${item.id}`}
                rows={8}
                maxLength={maxListeningTranscriptLength + 1}
                value={item.transcript ?? ""}
                disabled={!editable || busy}
                aria-invalid={Boolean(transcriptError)}
                onChange={(event) => patch(item.id, { transcript: event.target.value })}
              />
            </FormField>
            <p className="text-right text-xs text-slate-500">{item.transcript?.length ?? 0} / {maxListeningTranscriptLength}</p>
            {editable && <Button type={listeningControlTypes.save} isLoading={busy} disabled={busy || !item.title.trim() || Boolean(transcriptError)}>Save listening</Button>}
          </form>
        );
      })}
    </section>
  );
}
