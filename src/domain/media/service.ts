import { MediaLibraryUnavailableError } from "./errors";
import type { MediaAssetSummary, MediaLibraryQuery, MediaLibraryResult, MediaUploadInput } from "./types";

export interface MediaLibraryService {
  listMedia(query: MediaLibraryQuery): Promise<MediaLibraryResult>;
  getMedia(id: string): Promise<MediaAssetSummary>;
  uploadMedia(input: MediaUploadInput): Promise<MediaAssetSummary>;
  resolvePreviewUrl(id: string): Promise<string>;
  deleteMedia(id: string): Promise<void>;
  replaceMedia(id: string, file: File): Promise<MediaAssetSummary>;
}

function unavailable(): never { throw new MediaLibraryUnavailableError(); }
export const unavailableMediaLibraryService: MediaLibraryService = {
  async listMedia() { return unavailable(); },
  async getMedia() { return unavailable(); },
  async uploadMedia() { return unavailable(); },
  async resolvePreviewUrl() { return unavailable(); },
  async deleteMedia() { return unavailable(); },
  async replaceMedia() { return unavailable(); },
};
