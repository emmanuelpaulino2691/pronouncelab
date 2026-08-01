import { supabase } from "../../shared/lib/supabaseClient";
import { MediaLibraryError, MediaLibraryUnavailableError } from "./errors";
import type { MediaAssetSummary, MediaLibraryQuery, MediaLibraryResult, MediaSelection, MediaUploadInput } from "./types";

export interface MediaLibraryService {
  listMedia(query: MediaLibraryQuery): Promise<MediaLibraryResult>;
  getMedia(id: string): Promise<MediaAssetSummary>;
  uploadMedia(input: MediaUploadInput): Promise<MediaAssetSummary>;
  resolvePreviewUrl(id: string): Promise<string>;
  deleteMedia(id: string): Promise<void>;
  replaceMedia(id: string, file: File): Promise<MediaAssetSummary>;
}

export type MediaAssetRow = { id: string; kind: "image" | "audio"; original_filename: string; mime_type: string; bucket: string; object_path: string; created_at: string; updated_at: string; uploaded_by: string | null };
const mediaColumns = "id,kind,original_filename,mime_type,bucket,object_path,created_at,updated_at,uploaded_by";

export function normalizeMediaAssetRow(row: MediaAssetRow): MediaAssetSummary {
  return { id: row.id, kind: row.kind, filename: row.original_filename, mimeType: row.mime_type, bucket: row.bucket, objectPath: row.object_path, createdAt: row.created_at, updatedAt: row.updated_at, uploadedBy: row.uploaded_by };
}
export function mediaSelectionFromAsset(asset: Pick<MediaAssetSummary, "id" | "kind">): MediaSelection { return { mediaAssetId: asset.id, kind: asset.kind }; }

export function mediaListOrder(sort: MediaLibraryQuery["sort"]): { column: "created_at" | "original_filename"; ascending: boolean } {
  if (sort === "oldest") return { column: "created_at", ascending: true };
  if (sort === "name-asc") return { column: "original_filename", ascending: true };
  if (sort === "name-desc") return { column: "original_filename", ascending: false };
  return { column: "created_at", ascending: false };
}
export function mediaListQueryPlan(query: MediaLibraryQuery) { return { table: "media_assets" as const, kind: query.kind === "all" ? null : query.kind, search: query.search.trim(), order: mediaListOrder(query.sort) }; }

function client() { if (!supabase) throw new MediaLibraryUnavailableError("Supabase is not configured."); return supabase; }
export function controlledMediaQueryError(error: { code?: string } | null) { return new MediaLibraryError(error?.code === "42501" ? "permission" : "load"); }

export type MediaPreviewGateway = { publicUrl: (bucket: string, objectPath: string) => string; signedUrl: (bucket: string, objectPath: string) => Promise<string> };
export function mediaPreviewAccess(bucket: string) { return bucket === "content-audio" || bucket === "content-images" ? "public" : "signed"; }
export async function resolveMediaAssetPreviewWith(asset: Pick<MediaAssetSummary, "bucket" | "objectPath">, gateway: MediaPreviewGateway) {
  return mediaPreviewAccess(asset.bucket) === "public" ? gateway.publicUrl(asset.bucket, asset.objectPath) : gateway.signedUrl(asset.bucket, asset.objectPath);
}
export async function resolveMediaAssetPreview(asset: Pick<MediaAssetSummary, "bucket" | "objectPath">) {
  return resolveMediaAssetPreviewWith(asset, {
    publicUrl: (bucket, objectPath) => client().storage.from(bucket).getPublicUrl(objectPath).data.publicUrl,
    signedUrl: async (bucket, objectPath) => { const { data, error } = await client().storage.from(bucket).createSignedUrl(objectPath, 60 * 60); if (error || !data?.signedUrl) throw new MediaLibraryError("preview"); return data.signedUrl; },
  });
}
export async function resolveMediaAssetPreviewSafely(asset: Pick<MediaAssetSummary, "bucket" | "objectPath">, resolver = resolveMediaAssetPreview) {
  try { return { url: await resolver(asset), failed: false as const }; } catch { return { url: "", failed: true as const }; }
}

export const supabaseMediaLibraryService: MediaLibraryService = {
  async listMedia(query) {
    const plan = mediaListQueryPlan(query);
    let request = client().from(plan.table).select(mediaColumns, { count: "exact" });
    if (plan.kind) request = request.eq("kind", plan.kind);
    if (plan.search) request = request.ilike("original_filename", `%${plan.search}%`);
    const { data, error, count } = await request.order(plan.order.column, { ascending: plan.order.ascending });
    if (error) throw controlledMediaQueryError(error);
    return { items: (data as unknown as MediaAssetRow[]).map(normalizeMediaAssetRow), totalCount: count ?? undefined };
  },
  async getMedia(id) {
    const { data, error } = await client().from("media_assets").select(mediaColumns).eq("id", id).maybeSingle();
    if (error) throw controlledMediaQueryError(error);
    if (!data) throw new MediaLibraryError("not_found");
    return normalizeMediaAssetRow(data as unknown as MediaAssetRow);
  },
  async resolvePreviewUrl(id) { return resolveMediaAssetPreview(await this.getMedia(id)); },
  async uploadMedia() { throw new MediaLibraryError("mutation_unavailable"); },
  async deleteMedia() { throw new MediaLibraryError("mutation_unavailable"); },
  async replaceMedia() { throw new MediaLibraryError("mutation_unavailable"); },
};
