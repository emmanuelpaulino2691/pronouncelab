export type MediaKind = "image" | "audio";
export type MediaLibrarySort = "newest" | "oldest" | "name-asc" | "name-desc";

export type MediaAssetSummary = {
  id: string;
  kind: MediaKind;
  filename: string;
  mimeType: string;
  bucket: string;
  objectPath: string;
  createdAt: string;
  updatedAt: string;
  uploadedBy: string | null;
  usageCount?: number;
  /** Runtime-only signed/public URL. Never serialize this value. */
  previewUrl?: string;
};

export type MediaLibraryQuery = {
  kind: MediaKind | "all";
  search: string;
  sort: MediaLibrarySort;
  cursor?: string;
  page?: number;
};

export type MediaLibraryResult = { items: MediaAssetSummary[]; totalCount?: number; nextCursor?: string };
export type MediaSelection = { mediaAssetId: string; kind: MediaKind };
export type MediaUploadInput = { kind: MediaKind; file: File };
