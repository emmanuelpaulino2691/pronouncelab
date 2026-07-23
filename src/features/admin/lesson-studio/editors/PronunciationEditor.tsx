import { useEffect, useState } from "react";

import { Alert, Button, Card, FormField, TextArea, TextInput } from "../../ui";
import ListeningAudioField from "../components/ListeningAudioField";
import {
  getPronunciationEntriesError,
  moveEntry,
  normalizePronunciationEntries,
  parseMinimalPairLines,
  parseWordLines,
  removeEntry,
  type MinimalPair,
  type PronunciationBlockType,
} from "../pronunciationBlocks";
import {
  createPronunciationBlock,
  deletePronunciationBlock,
  listPronunciationItems,
  reorderPronunciationBlocks,
  savePronunciationBlock,
  savePronunciationItem,
} from "../services/activityContentService";
import type { PronunciationItem } from "../types";

export default function PronunciationEditor({ activityId, editable, onDirtyChange }: { activityId: number; editable: boolean; onDirtyChange: (dirty: boolean) => void }) {
  const [items, setItems] = useState<PronunciationItem[]>([]);
  const [loadedActivityId, setLoadedActivityId] = useState<number | null>(null);
  const [pendingId, setPendingId] = useState<number | "create" | "reorder" | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    void listPronunciationItems(activityId)
      .then((value) => { if (active) setItems(value); })
      .catch(() => { if (active) setMessage("We couldn’t load the pronunciation content. Try reopening the activity."); })
      .finally(() => { if (active) setLoadedActivityId(activityId); });
    return () => { active = false; };
  }, [activityId]);

  function patch(id: number, values: Partial<PronunciationItem>) {
    onDirtyChange(true);
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...values } : item));
  }

  async function create(type: PronunciationBlockType) {
    if (pendingId) return;
    setPendingId("create"); setMessage("");
    try {
      const created = await createPronunciationBlock(activityId, type, type === "word_list" ? "Word List" : "Minimal Pairs");
      setItems((current) => [...current, created]);
      setMessage("Pronunciation block added. Add its learning content, then save.");
    } catch { setMessage("The pronunciation block could not be added. Try again."); }
    finally { setPendingId(null); }
  }

  async function save(item: PronunciationItem) {
    if (pendingId) return;
    if (!item.title.trim()) { setMessage("Add a block title before saving."); return; }
    setPendingId(item.id); setMessage("");
    try {
      const saved = item.blockType
        ? await savePronunciationBlock({ ...item, entries: normalizePronunciationEntries(item.blockType, item.entries) }, activityId)
        : await savePronunciationItem(item, activityId);
      patch(item.id, saved);
      onDirtyChange(false);
      setMessage("Pronunciation content saved.");
    } catch { setMessage("The pronunciation content could not be saved. Your changes are still here. Try again."); }
    finally { setPendingId(null); }
  }

  async function remove(item: PronunciationItem) {
    if (pendingId || !item.blockType || !window.confirm(`Delete “${item.title}”?`)) return;
    setPendingId(item.id); setMessage("");
    try { await deletePronunciationBlock(item.id, activityId); setItems((current) => current.filter((value) => value.id !== item.id)); }
    catch { setMessage("The pronunciation block could not be deleted. Try again."); }
    finally { setPendingId(null); }
  }

  async function moveBlock(index: number, direction: -1 | 1) {
    if (pendingId) return;
    const next = moveEntry(items, index, direction);
    if (next.every((item, itemIndex) => item.id === items[itemIndex]?.id)) return;
    setPendingId("reorder"); setMessage("");
    try { setItems(await reorderPronunciationBlocks(activityId, next.map((item) => item.id))); }
    catch { setMessage("The block order could not be saved. Try again."); }
    finally { setPendingId(null); }
  }

  if (loadedActivityId !== activityId) return <Card className="p-6" role="status">Loading pronunciation content…</Card>;

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-950">Pronunciation content</h2>
        <p className="mt-1 text-sm text-slate-600">Build focused word lists and minimal-pair practice. Existing pronunciation items remain supported.</p>
      </div>
      {message && <Alert tone={message.includes("could not") || message.startsWith("Add ") ? "error" : "success"}>{message}</Alert>}
      {editable && (
        <div className="flex flex-wrap gap-2" aria-label="Add pronunciation block">
          <Button type="button" disabled={Boolean(pendingId)} onClick={() => void create("word_list")}>Add Word List</Button>
          <Button type="button" variant="secondary" disabled={Boolean(pendingId)} onClick={() => void create("minimal_pairs")}>Add Minimal Pairs</Button>
        </div>
      )}
      {items.map((item, index) => item.blockType ? (
        <PronunciationBlockForm
          key={item.id} item={item} editable={editable} busy={Boolean(pendingId)}
          onPatch={(values) => patch(item.id, values)} onSave={() => void save(item)} onDelete={() => void remove(item)}
          onMoveUp={() => void moveBlock(index, -1)} onMoveDown={() => void moveBlock(index, 1)}
          canMoveUp={index > 0} canMoveDown={index < items.length - 1}
        />
      ) : (
        <LegacyPronunciationForm key={item.id} item={item} editable={editable} busy={Boolean(pendingId)} onPatch={(values) => patch(item.id, values)} onSave={() => void save(item)} />
      ))}
    </section>
  );
}

function PronunciationBlockForm({ item, editable, busy, onPatch, onSave, onDelete, onMoveUp, onMoveDown, canMoveUp, canMoveDown }: {
  item: PronunciationItem; editable: boolean; busy: boolean; onPatch: (values: Partial<PronunciationItem>) => void;
  onSave: () => void; onDelete: () => void; onMoveUp: () => void; onMoveDown: () => void; canMoveUp: boolean; canMoveDown: boolean;
}) {
  const [pasteText, setPasteText] = useState("");
  const type = item.blockType!;
  const entriesError = getPronunciationEntriesError(type, item.entries);
  const words = type === "word_list" ? item.entries.filter((entry): entry is string => typeof entry === "string") : [];
  const pairs = type === "minimal_pairs" ? item.entries.filter((entry): entry is MinimalPair => typeof entry !== "string") : [];
  function applyPaste() {
    const parsed = type === "word_list" ? parseWordLines(pasteText) : parseMinimalPairLines(pasteText);
    if (parsed.length) { onPatch({ entries: [...item.entries, ...parsed] }); setPasteText(""); }
  }
  return (
    <form className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6" onSubmit={(event) => { event.preventDefault(); onSave(); }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-xs font-bold uppercase tracking-wide text-blue-700">{type === "word_list" ? "Word List" : "Minimal Pairs"}</p></div>
        {editable && <div className="flex flex-wrap gap-2"><Button type="button" variant="secondary" disabled={busy || !canMoveUp} aria-label={`Move ${item.title} up`} onClick={onMoveUp}>Up</Button><Button type="button" variant="secondary" disabled={busy || !canMoveDown} aria-label={`Move ${item.title} down`} onClick={onMoveDown}>Down</Button><Button type="button" variant="danger" disabled={busy} onClick={onDelete}>Delete</Button></div>}
      </div>
      <FormField label="Title" htmlFor={`pronunciation-title-${item.id}`} required><TextInput id={`pronunciation-title-${item.id}`} value={item.title} disabled={!editable || busy} onChange={(event) => onPatch({ title: event.target.value })} /></FormField>
      <FormField label="Instructions (optional)" htmlFor={`pronunciation-instructions-${item.id}`}><TextArea id={`pronunciation-instructions-${item.id}`} value={item.instructions ?? ""} disabled={!editable || busy} onChange={(event) => onPatch({ instructions: event.target.value })} /></FormField>
      {type === "word_list" && <FormField label="Spelling pattern (optional)" htmlFor={`pronunciation-pattern-${item.id}`}><TextInput id={`pronunciation-pattern-${item.id}`} value={item.spellingPattern ?? ""} disabled={!editable || busy} onChange={(event) => onPatch({ spellingPattern: event.target.value })} /></FormField>}
      <ListeningAudioField activityId={item.activityId} audioAssetId={item.audioAssetId} disabled={!editable || busy} context="pronunciation" attachmentLabel="pronunciation block" requiredForPublication={false} onChange={(audioAssetId) => onPatch({ audioAssetId })} />
      <fieldset className="space-y-3"><legend className="text-sm font-semibold text-slate-800">{type === "word_list" ? "Words" : "Pairs"}</legend>
        {(type === "word_list" ? words : pairs).map((entry, entryIndex) => <div key={entryIndex} className="flex flex-wrap items-center gap-2">
          {typeof entry === "string" ? <TextInput aria-label={`Word ${entryIndex + 1}`} value={entry} disabled={!editable || busy} onChange={(event) => onPatch({ entries: item.entries.map((value, index) => index === entryIndex ? event.target.value : value) })} /> : <><TextInput aria-label={`Pair ${entryIndex + 1} left word`} value={entry.left} disabled={!editable || busy} onChange={(event) => onPatch({ entries: item.entries.map((value, index) => index === entryIndex && typeof value !== "string" ? { ...value, left: event.target.value } : value) })} /><TextInput aria-label={`Pair ${entryIndex + 1} right word`} value={entry.right} disabled={!editable || busy} onChange={(event) => onPatch({ entries: item.entries.map((value, index) => index === entryIndex && typeof value !== "string" ? { ...value, right: event.target.value } : value) })} /></>}
          {editable && <><Button type="button" variant="secondary" disabled={busy || entryIndex === 0} aria-label={`Move entry ${entryIndex + 1} up`} onClick={() => onPatch({ entries: moveEntry(item.entries, entryIndex, -1) })}>Up</Button><Button type="button" variant="secondary" disabled={busy || entryIndex === item.entries.length - 1} aria-label={`Move entry ${entryIndex + 1} down`} onClick={() => onPatch({ entries: moveEntry(item.entries, entryIndex, 1) })}>Down</Button><Button type="button" variant="danger" disabled={busy} aria-label={`Remove entry ${entryIndex + 1}`} onClick={() => onPatch({ entries: removeEntry(item.entries, entryIndex) })}>Remove</Button></>}
        </div>)}
        {editable && <Button type="button" variant="secondary" disabled={busy} onClick={() => onPatch({ entries: [...item.entries, type === "word_list" ? "" : { left: "", right: "" }] })}>{type === "word_list" ? "Add word" : "Add pair"}</Button>}
      </fieldset>
      {editable && <FormField label={type === "word_list" ? "Paste multiple words" : "Paste multiple pairs"} htmlFor={`pronunciation-paste-${item.id}`} hint={type === "word_list" ? "Use one word per line." : "Use a comma or Tab between each pair."}><TextArea id={`pronunciation-paste-${item.id}`} value={pasteText} disabled={busy} onChange={(event) => setPasteText(event.target.value)} /><Button type="button" variant="secondary" className="mt-2" disabled={busy || !pasteText.trim()} onClick={applyPaste}>Add pasted entries</Button></FormField>}
      {entriesError && <p className="text-sm text-amber-700">Draft allowed: {entriesError} This must be resolved before publication.</p>}
      {editable && <Button type="submit" disabled={busy || !item.title.trim()}>Save block</Button>}
    </form>
  );
}

function LegacyPronunciationForm({ item, editable, busy, onPatch, onSave }: { item: PronunciationItem; editable: boolean; busy: boolean; onPatch: (values: Partial<PronunciationItem>) => void; onSave: () => void }) {
  return <form className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5" onSubmit={(event) => { event.preventDefault(); onSave(); }}><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Existing pronunciation item</p><FormField label="Title" htmlFor={`legacy-title-${item.id}`} required><TextInput id={`legacy-title-${item.id}`} value={item.title} disabled={!editable || busy} onChange={(event) => onPatch({ title: event.target.value })} /></FormField><FormField label="Word or phrase" htmlFor={`legacy-text-${item.id}`}><TextInput id={`legacy-text-${item.id}`} value={item.displayText} disabled={!editable || busy} onChange={(event) => onPatch({ displayText: event.target.value })} /></FormField><FormField label="Instructions (optional)" htmlFor={`legacy-instructions-${item.id}`}><TextArea id={`legacy-instructions-${item.id}`} value={item.instructions ?? ""} disabled={!editable || busy} onChange={(event) => onPatch({ instructions: event.target.value })} /></FormField>{editable && <Button type="submit" disabled={busy || !item.title.trim()}>Save existing item</Button>}</form>;
}
