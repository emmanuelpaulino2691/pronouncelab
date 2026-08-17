import type { TheoryBlock, TheoryBlockType } from "./types";

export type TheoryBlockRow = {
  id: number;
  activity_id: number;
  block_type: TheoryBlockType;
  position: number;
  heading_level: number | null;
  title: string | null;
  text: string | null;
  media_asset_id: string | null;
  alt_text: string | null;
  updated_at: string;
};

export function buildTheoryBlockSavePayload(block: TheoryBlock) {
  return {
    block_type: block.blockType,
    heading_level: block.blockType === "heading" ? block.headingLevel ?? 2 : null,
    title: block.title?.trim() || null,
    text: block.text?.trim() ?? "",
    media_asset_id: block.mediaAssetId,
    alt_text: block.altText?.trim() || null,
  };
}

export function buildTheoryBlockDuplicatePayload(block: TheoryBlock, activityId: number, position: number) {
  return {
    activity_id: activityId,
    position,
    block_type: block.blockType,
    heading_level: block.headingLevel,
    title: block.title,
    text: block.text,
    media_asset_id: block.mediaAssetId,
    alt_text: block.altText,
  };
}

export function parseTheoryBlockRow(row: TheoryBlockRow): TheoryBlock {
  return {
    id: row.id,
    activityId: row.activity_id,
    blockType: row.block_type,
    position: row.position,
    headingLevel: row.heading_level,
    title: row.title,
    text: row.text,
    mediaAssetId: row.media_asset_id,
    altText: row.alt_text,
    updatedAt: row.updated_at,
  };
}

export function assertSavedMediaReference(requested: TheoryBlock, saved: TheoryBlock) {
  if (requested.mediaAssetId !== saved.mediaAssetId) {
    throw new Error("The block was not saved with its selected media. Try saving again.");
  }
  return saved;
}
