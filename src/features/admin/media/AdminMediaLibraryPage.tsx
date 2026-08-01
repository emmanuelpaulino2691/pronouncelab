import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { canUploadMedia, canViewMediaLibrary, getMediaLibraryErrorMessage, MediaLibraryUnavailableError, supabaseMediaLibraryService, type MediaAssetSummary, type MediaKind } from "../../../domain/media";
import { useAdminPermissions } from "../permissions/useAdminPermissions";
import { Alert, Button, Dialog, EmptyState, PageHeader, Select, TextInput } from "../ui";
import MediaAssetCard from "./MediaAssetCard";
import { parseMediaLibraryQuery, updateMediaLibraryQuery } from "./mediaLibraryQuery";

const tabs: Array<{ value: MediaKind | "all"; label: string }> = [{ value: "all", label: "All" }, { value: "image", label: "Images" }, { value: "audio", label: "Audio" }];

export default function AdminMediaLibraryPage() {
  const permissions = useAdminPermissions();
  const [params, setParams] = useSearchParams();
  const query = useMemo(() => parseMediaLibraryQuery(params), [params]);
  const [state, setState] = useState<{ status: "loading" | "ready" | "unavailable" | "error"; items: MediaAssetSummary[]; message?: string }>({ status: "loading", items: [] });
  const [showUploadInfo, setShowUploadInfo] = useState(false);
  const canView = canViewMediaLibrary(permissions);
  const canUpload = canUploadMedia(permissions);
  useEffect(() => {
    if (!canView) return;
    let active = true;
    void supabaseMediaLibraryService.listMedia(query).then((result) => { if (active) setState({ status: "ready", items: result.items }); }, (error: unknown) => { if (active) setState({ status: error instanceof MediaLibraryUnavailableError ? "unavailable" : "error", items: [], message: getMediaLibraryErrorMessage(error) }); });
    return () => { active = false; };
  }, [canView, query]);
  if (!canView) return <Alert tone="error">Your role does not provide access to the Media Library.</Alert>;
  const setQuery = (update: Parameters<typeof updateMediaLibraryQuery>[1]) => setParams(updateMediaLibraryQuery(params, update), { replace: true });
  return <section className="mx-auto max-w-7xl space-y-6">
    <PageHeader eyebrow="Teacher Workspace" title="Media Library" description="Reuse images and audio across your teaching content." actions={<Button type="button" icon="plus" disabled={!canUpload} title={!canUpload ? "Your role can review media but cannot upload it." : undefined} onClick={() => setShowUploadInfo(true)}>Upload media</Button>} />
    {!canUpload && <Alert>Media is read-only for your current role. Upload, replace, and delete controls are unavailable.</Alert>}
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div role="tablist" aria-label="Media kind" className="flex flex-wrap gap-2">{tabs.map((tab) => <button key={tab.value} type="button" role="tab" aria-selected={query.kind === tab.value} onClick={() => setQuery({ kind: tab.value })} className={`admin-focus min-h-10 rounded-xl px-4 text-sm font-semibold ${query.kind === tab.value ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}>{tab.label}</button>)}</div>
      <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_14rem]"><label className="block text-sm font-semibold text-slate-800">Search by filename<TextInput type="search" value={query.search} onChange={(event) => setQuery({ search: event.target.value })} placeholder="Search media" className="mt-2" /></label><label className="block text-sm font-semibold text-slate-800">Sort<Select value={query.sort} onChange={(event) => setQuery({ sort: event.target.value as typeof query.sort })} className="mt-2"><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="name-asc">Name A–Z</option><option value="name-desc">Name Z–A</option></Select></label></div>
    </div>
    {state.status === "loading" && <div role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">Loading media library…</div>}
    {state.status === "unavailable" && <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950"><h2 className="font-bold">Media Library unavailable</h2><p className="mt-2 text-sm">Media Library could not connect because Supabase is not configured.</p></div>}
    {state.status === "error" && <Alert tone="error">{state.message ?? "Media Library could not be loaded."} Refresh the page to try again.</Alert>}
    {state.status === "ready" && state.items.length === 0 && <EmptyState title={query.search || query.kind !== "all" ? "No media matches your current filters." : "No media has been added to your library yet."} description={query.search || query.kind !== "all" ? "Try changing the filename search or media type." : "Uploaded images and audio will appear here when the shared Media Library backend is connected."} />}
    {state.items.length > 0 && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{state.items.map((asset) => <MediaAssetCard key={asset.id} asset={asset} readOnly={!canUpload} />)}</div>}
    <Dialog isOpen={showUploadInfo} onClose={() => setShowUploadInfo(false)} title="Upload media" description="Use an activity editor to upload media." footer={<Button type="button" onClick={() => setShowUploadInfo(false)}>Close</Button>}><p className="text-sm leading-6 text-slate-600">Shared upload is not available yet. Existing direct uploads in Lesson Studio register assets automatically, and those assets appear here.</p></Dialog>
  </section>;
}
