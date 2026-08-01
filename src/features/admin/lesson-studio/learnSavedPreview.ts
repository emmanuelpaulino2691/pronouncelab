import type { LearnerTheoryActivity, LearnerTheoryBlock } from "../../../shared/content/contracts/learnerActivities";
import type { ContentId } from "../../../shared/content/contracts/learnerContent";
import type { TheoryBlock } from "./types";

export function mapSavedLearnBlocks(
  blocks: readonly TheoryBlock[],
  mediaUrls: Readonly<Record<number, string>>,
): readonly LearnerTheoryBlock[] {
  return blocks.map((block): LearnerTheoryBlock => {
    switch (block.blockType) {
      case "heading": return { type: "heading", level: (block.headingLevel ?? 2) as 1 | 2 | 3, text: block.text ?? block.title ?? "" };
      case "paragraph": return { type: "paragraph", text: block.text ?? "" };
      case "tip": return { type: "tip", text: block.text ?? "" };
      case "example": return { type: "example", title: block.title ?? "Example", text: block.text ?? "" };
      case "image": return { type: "image", media: { id: (block.mediaAssetId ?? `missing-${block.id}`) as ContentId, kind: "image", url: mediaUrls[block.id] ?? "", mimeType: null, altText: block.altText }, alt: block.altText ?? "" };
      case "audio": return { type: "audio", media: { id: (block.mediaAssetId ?? `missing-${block.id}`) as ContentId, kind: "audio", url: mediaUrls[block.id] ?? "", mimeType: "audio/mpeg", altText: null }, label: block.title ?? "", transcript: block.text ?? "" };
    }
  });
}

export function savedLearnActivity(activityId: number, blocks: readonly TheoryBlock[], mediaUrls: Readonly<Record<number, string>>): LearnerTheoryActivity {
  return { id: String(activityId) as ContentId, type: "theory", title: "Saved Learn preview", position: 0, required: false, blocks: mapSavedLearnBlocks(blocks, mediaUrls) };
}

export function savedPreviewNotice(dirty: boolean): string | null {
  return dirty ? "Preview shows the last saved version." : null;
}
