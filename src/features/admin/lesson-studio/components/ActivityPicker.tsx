import { useMemo, useRef, useState } from "react";
import { activityTemplateRegistry, favoriteTemplatesKey, getActivityTemplate, orderFavoriteTemplates, parseStoredTemplateIds, recentTemplatesKey, recordRecent, toggleFavorite, type ActivityTemplate } from "../../../../domain/templates";
import { activityCatalog } from "../activityCatalog";
import { beginActivityCreation, completeActivityCreation, failActivityCreation, openActivityPicker } from "../activityPickerState";
import type { ActivityType } from "../types";
import { Alert, Badge, Button, Card, Dialog, Spinner } from "../../ui";
import { smartBuilderGridClassName } from "../smartBuilderPresentation";

type ActivityPickerProps = { onClose: () => void; onCreate: (type: ActivityType) => Promise<void> };
const validTemplateIds = new Set(activityTemplateRegistry.map((item) => item.id));

function loadIds(key: string) {
  if (typeof window === "undefined") return [];
  try { return parseStoredTemplateIds(window.localStorage.getItem(key), validTemplateIds); }
  catch { return []; }
}

function TemplateCard({ template, favorite, onFavorite, onOpen }: { template: ActivityTemplate; favorite: boolean; onFavorite: () => void; onOpen: () => void }) {
  return <Card className="flex min-w-0 flex-col p-4">
    <div className="flex items-start justify-between gap-3"><Badge tone="info">{template.learnerLevel}</Badge><button type="button" aria-label={`${favorite ? "Remove" : "Add"} ${template.name} ${favorite ? "from" : "to"} favorites`} aria-pressed={favorite} onClick={onFavorite} className="admin-focus min-h-11 min-w-11 rounded-lg border border-slate-300 text-lg">{favorite ? "★" : "☆"}</button></div>
    <h3 className="mt-3 font-bold text-slate-950">{template.name}</h3><p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{template.description}</p>
    <p className="mt-3 text-xs font-semibold text-slate-500">{template.duration} · {template.tags.join(" · ")}</p>
    <Button type="button" variant="secondary" className="mt-4 w-full" onClick={onOpen}>Preview template</Button>
  </Card>;
}

export default function ActivityPicker({ onClose, onCreate }: ActivityPickerProps) {
  const [state, setState] = useState(openActivityPicker);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState(() => loadIds(favoriteTemplatesKey));
  const [recents, setRecents] = useState(() => loadIds(recentTemplatesKey));
  const [announcement, setAnnouncement] = useState("");
  const submissionRef = useRef(false);
  const isSubmitting = state.status === "submitting";
  const preview = previewId ? getActivityTemplate(previewId) : null;
  const orderedTemplates = useMemo(() => orderFavoriteTemplates(activityTemplateRegistry, favorites), [favorites]);

  function store(key: string, ids: string[]) { try { window.localStorage.setItem(key, JSON.stringify(ids)); return true; } catch { setAnnouncement("Template preferences could not be saved in this browser."); return false; } }
  function favorite(template: ActivityTemplate) { const next = toggleFavorite(favorites, template.id); setFavorites(next); if (store(favoriteTemplatesKey, next)) setAnnouncement(`${template.name} ${next.includes(template.id) ? "added to" : "removed from"} favorites.`); }
  function openPreview(template: ActivityTemplate) { const next = recordRecent(recents, template.id); setRecents(next); if (store(recentTemplatesKey, next)) setAnnouncement(`${template.name} added to recently used templates.`); setPreviewId(template.id); }

  async function create(type: ActivityType) {
    if (submissionRef.current) return;
    const next = beginActivityCreation(state, type); if (next === state) return;
    submissionRef.current = true; setState(next); setErrorMessage(null);
    try { await onCreate(type); setState((current) => completeActivityCreation(current)); }
    catch { setState((current) => failActivityCreation(current)); setErrorMessage("The activity could not be added. Your selection is still available, so you can try again."); }
    finally { submissionRef.current = false; }
  }

  return <>
    <Dialog isOpen={preview === null} onClose={onClose} preventClose={isSubmitting} title="Smart Content Builder" description="Choose a starting point to build your lesson." className="max-w-6xl">
      <p className="sr-only" aria-live="polite">{announcement}</p>
      {errorMessage && <div className="mb-5"><Alert tone="error">{errorMessage}</Alert></div>}
      {favorites.length > 0 && <section><h2 className="text-lg font-bold text-slate-950">Favorites</h2><div className={`mt-3 ${smartBuilderGridClassName}`}>{favorites.map(getActivityTemplate).filter((item): item is ActivityTemplate => item !== null).map((item) => <TemplateCard key={`favorite-${item.id}`} template={item} favorite onFavorite={() => favorite(item)} onOpen={() => openPreview(item)} />)}</div></section>}
      {recents.length > 0 && <section className="mt-7"><h2 className="text-lg font-bold text-slate-950">Recently Used</h2><div className="mt-3 flex flex-wrap gap-2">{recents.map(getActivityTemplate).filter((item): item is ActivityTemplate => item !== null).map((item) => <Button key={`recent-${item.id}`} variant="secondary" onClick={() => openPreview(item)}>{item.name}</Button>)}</div></section>}
      <section className="mt-7"><h2 className="text-lg font-bold text-slate-950">Activity templates</h2><div className={`mt-3 ${smartBuilderGridClassName}`}>{orderedTemplates.map((item) => <TemplateCard key={item.id} template={item} favorite={favorites.includes(item.id)} onFavorite={() => favorite(item)} onOpen={() => openPreview(item)} />)}</div></section>
      <section className="mt-8 border-t border-slate-200 pt-7"><h2 className="text-lg font-bold text-slate-950">Blank Activities</h2><p className="mt-1 text-sm text-slate-600">Create an empty activity using the existing authoring workflow.</p><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{activityCatalog.map((activity) => <Button key={activity.type} type="button" variant="secondary" disabled={isSubmitting || !activity.canCreate} title={"unavailableReason" in activity ? activity.unavailableReason : undefined} onClick={() => void create(activity.type)}>{isSubmitting && state.selectedType === activity.type && <Spinner />}Blank {activity.title}</Button>)}</div></section>
    </Dialog>
    <Dialog isOpen={preview !== null} onClose={() => setPreviewId(null)} title={preview?.name ?? "Template preview"} description="Preview information only. No activity will be created." footer={<Button onClick={() => setPreviewId(null)}>Close preview</Button>}>
      {preview && <dl className="grid gap-4 sm:grid-cols-2"><div><dt className="text-xs font-bold uppercase text-slate-500">Activity type</dt><dd className="mt-1 text-slate-900">{preview.activityType}</dd></div><div><dt className="text-xs font-bold uppercase text-slate-500">Learner level</dt><dd className="mt-1 text-slate-900">{preview.learnerLevel}</dd></div><div><dt className="text-xs font-bold uppercase text-slate-500">Typical duration</dt><dd className="mt-1 text-slate-900">{preview.duration}</dd></div><div><dt className="text-xs font-bold uppercase text-slate-500">Recommended use</dt><dd className="mt-1 text-slate-900">{preview.recommendedUse}</dd></div><div className="sm:col-span-2"><dt className="text-xs font-bold uppercase text-slate-500">Description</dt><dd className="mt-1 text-slate-900">{preview.description}</dd></div><div className="sm:col-span-2"><dt className="text-xs font-bold uppercase text-slate-500">Tags</dt><dd className="mt-2 flex flex-wrap gap-2">{preview.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}</dd></div></dl>}
    </Dialog>
  </>;
}
