import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { canUploadMedia, canViewMediaLibrary, getMediaLibraryErrorMessage, MediaLibraryUnavailableError, supabaseMediaLibraryService, type MediaAssetSummary, type MediaKind } from "../../../domain/media";
import { useAdminPermissions } from "../permissions/useAdminPermissions";
import { Alert, Button, Card, Dialog, EmptyState, LoadingSkeleton, PageHeader, Select, TextInput } from "../ui";
import MediaAssetCard from "./MediaAssetCard";
import { parseMediaLibraryQuery, updateMediaLibraryQuery } from "./mediaLibraryQuery";

const tabs: Array<{ value: MediaKind | "all"; label: string }> = [{ value: "all", label: "All" }, { value: "image", label: "Images" }, { value: "audio", label: "Audio" }];

export default function AdminMediaLibraryPage() {
  const permissions = useAdminPermissions();
  const [params, setParams] = useSearchParams();
  const query = useMemo(() => parseMediaLibraryQuery(params), [params]);
  const [state, setState] = useState<{ status: "loading" | "ready" | "unavailable" | "error"; items: MediaAssetSummary[]; message?: string }>({ status: "loading", items: [] });
  const [showUploadInfo, setShowUploadInfo] = useState(false);
  const requestRef = useRef(0);
  const canView = canViewMediaLibrary(permissions);
  const canUpload = canUploadMedia(permissions);
  const requestMedia = useCallback(() => {
    if (!canView) return;
    const request = ++requestRef.current;
    void supabaseMediaLibraryService.listMedia(query).then((result) => { if (requestRef.current === request) setState({ status: "ready", items: result.items }); }, (error: unknown) => { if (requestRef.current === request) setState({ status: error instanceof MediaLibraryUnavailableError ? "unavailable" : "error", items: [], message: getMediaLibraryErrorMessage(error) }); });
  }, [canView, query]);
  useEffect(() => { requestMedia(); return () => { requestRef.current += 1; }; }, [requestMedia]);
  if (!canView) return <Alert tone="error">Your role does not provide access to the Media Library.</Alert>;
  const setQuery = (update: Parameters<typeof updateMediaLibraryQuery>[1]) => { setState({ status: "loading", items: [] }); setParams(updateMediaLibraryQuery(params, update), { replace: true }); };
  const retryMedia = () => { setState({ status: "loading", items: [] }); requestMedia(); };
  return <section className="mx-auto max-w-7xl space-y-6">
    <PageHeader eyebrow="Teacher Workspace" title="Media Library" description="Reuse images and audio across your teaching content." actions={<Button type="button" variant="secondary" icon="info" disabled={!canUpload} title={!canUpload ? "Your role can review media but cannot upload it." : undefined} onClick={() => setShowUploadInfo(true)}>How to add media</Button>} />
    {!canUpload && <Alert>Media is read-only for your current role. Upload, replace, and delete controls are unavailable.</Alert>}
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div role="tablist" aria-label="Media kind" className="flex flex-wrap gap-2">{tabs.map((tab) => <button key={tab.value} type="button" role="tab" aria-selected={query.kind === tab.value} onClick={() => setQuery({ kind: tab.value })} className={`admin-focus min-h-10 rounded-xl px-4 text-sm font-semibold ${query.kind === tab.value ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}>{tab.label}</button>)}</div>
      <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_14rem]"><label className="block text-sm font-semibold text-slate-800">Search by filename<TextInput type="search" value={query.search} onChange={(event) => setQuery({ search: event.target.value })} placeholder="Search media" className="mt-2" /></label><label className="block text-sm font-semibold text-slate-800">Sort<Select value={query.sort} onChange={(event) => setQuery({ sort: event.target.value as typeof query.sort })} className="mt-2"><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="name-asc">Name A–Z</option><option value="name-desc">Name Z–A</option></Select></label></div>
    </div>
    {state.status === "loading" && <div role="status" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map((item) => <Card key={item} className="p-4"><LoadingSkeleton className="aspect-[16/9] w-full" /><LoadingSkeleton className="mt-4 h-5 w-2/3" /><LoadingSkeleton className="mt-3 h-16" /></Card>)}<span className="sr-only">Loading Media Library…</span></div>}
    {state.status === "unavailable" && <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950"><h2 className="font-bold">Media Library unavailable</h2><p className="mt-2 text-sm">Media Library could not connect because Supabase is not configured.</p></div>}
    {state.status === "error" && <Alert tone="error" action={<Button variant="secondary" onClick={retryMedia}>Try again</Button>}>{state.message ?? "Media Library could not be loaded."}</Alert>}
    {state.status === "ready" && state.items.length === 0 && <EmptyState title={query.search || query.kind !== "all" ? "No media matches your current filters" : "No media has been added yet"} description={query.search || query.kind !== "all" ? "Try changing the filename search or media type." : "Upload an image or audio file from a supported Lesson Studio editor. Registered files appear here automatically."} action={query.search || query.kind !== "all" ? <Button variant="secondary" onClick={() => setQuery({ kind: "all", search: "" })}>Clear filters</Button> : undefined} />}
    {state.items.length > 0 && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{state.items.map((asset) => <MediaAssetCard key={asset.id} asset={asset} readOnly={!canUpload} />)}</div>}
    <Dialog isOpen={showUploadInfo} onClose={() => setShowUploadInfo(false)} title="Add media to the library" description="Upload from a supported Lesson Studio activity editor." footer={<Button type="button" onClick={() => setShowUploadInfo(false)}>Close</Button>}><p className="text-sm leading-6 text-slate-600">Shared upload is not available on this page yet. Direct uploads from Learn, Listening, and Pronunciation editors register automatically and appear in the Media Library.</p></Dialog>
  </section>;
}
