import type { MediaAssetSummary } from "../../../domain/media";

export function mediaAssetMetadata(asset: MediaAssetSummary) {
  return { filename: asset.filename, kindLabel: asset.kind === "image" ? "Image" : "Audio", mimeType: asset.mimeType, usageCount: asset.usageCount };
}
