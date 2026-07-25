import type { TheoryBlockType } from "./types";

export type LearnBlockDefinition = {
  type: TheoryBlockType;
  title: string;
  description: string;
  icon: string;
  future?: boolean;
};

export const learnBlockRegistry: readonly LearnBlockDefinition[] = [
  { type: "heading", title: "Heading", description: "Large lesson heading", icon: "heading" },
  { type: "paragraph", title: "Paragraph", description: "Normal explanatory text", icon: "text" },
  { type: "example", title: "Example", description: "A worked example", icon: "example" },
  { type: "tip", title: "Tip", description: "A helpful recommendation", icon: "tip" },
  { type: "image", title: "Image", description: "Insert an illustration", icon: "image" },
  { type: "audio", title: "Audio", description: "Insert pronunciation audio", icon: "audio" },
];

export function getLearnBlockDefinition(type: TheoryBlockType) {
  return learnBlockRegistry.find((block) => block.type === type) ?? learnBlockRegistry[1];
}
