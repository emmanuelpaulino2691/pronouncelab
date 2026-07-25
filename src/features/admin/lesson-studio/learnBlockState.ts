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
