import type { TheoryBlock } from "./types";

export function reorderLearnBlocks(blocks: readonly TheoryBlock[], from: number, to: number): TheoryBlock[] {
  if (from < 0 || to < 0 || from >= blocks.length || to >= blocks.length || from === to) return [...blocks];
  const next = [...blocks];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next.map((block, index) => ({ ...block, position: index }));
}

export function validateLearnBlock(block: TheoryBlock): string | null {
  if (["heading", "paragraph", "example", "tip"].includes(block.blockType) && !block.text?.trim()) return "Add text to this block.";
  if ((block.blockType === "image" || block.blockType === "audio") && !block.mediaAssetId) return `Add ${block.blockType} media to this block.`;
  return null;
}

export function isLearnBlockPopulated(block: TheoryBlock): boolean {
  return Boolean(block.title?.trim() || block.text?.trim() || block.mediaAssetId || block.altText?.trim());
}

export function insertDuplicatedLearnBlock(
  blocks: readonly TheoryBlock[],
  sourceId: number,
  duplicate: TheoryBlock,
): TheoryBlock[] {
  const index = blocks.findIndex((block) => block.id === sourceId);
  if (index < 0 || duplicate.id === sourceId) return [...blocks];
  const next = [...blocks];
  next.splice(index + 1, 0, duplicate);
  return next.map((block, position) => ({ ...block, position }));
}

export function removeLearnBlock(blocks: readonly TheoryBlock[], blockId: number): TheoryBlock[] {
  return blocks.filter((block) => block.id !== blockId).map((block, position) => ({ ...block, position }));
}

export function deletionFocusTarget(blocks: readonly TheoryBlock[], blockId: number): number | "add" {
  const index = blocks.findIndex((block) => block.id === blockId);
  if (index < 0) return "add";
  return blocks[index + 1]?.id ?? blocks[index - 1]?.id ?? "add";
}

export function canMoveLearnBlock(index: number, direction: -1 | 1, length: number): boolean {
  const target = index + direction;
  return index >= 0 && index < length && target >= 0 && target < length;
}

export function learnBlockSummary(block: TheoryBlock, mediaFilename?: string): string {
  const meaningful = block.title?.trim() || block.text?.trim().split(/\r?\n/, 1)[0] || mediaFilename?.trim();
  return meaningful || "Empty block";
}

export function toggleLearnBlockCollapsed(collapsed: ReadonlySet<number>, blockId: number): Set<number> {
  const next = new Set(collapsed);
  if (next.has(blockId)) next.delete(blockId); else next.add(blockId);
  return next;
}

export function collapseAllLearnBlocks(blocks: readonly TheoryBlock[]): Set<number> {
  return new Set(blocks.map((block) => block.id));
}

export function expandAllLearnBlocks(): Set<number> {
  return new Set();
}
