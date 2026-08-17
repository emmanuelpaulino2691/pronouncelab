export type LegacyPronunciationData = {
  id: number;
  title: string;
  audio: string;
  text: string;
};

export type PronunciationBlockData = {
  id: number;
  title: string;
  instructions?: string;
  audio?: string;
  blockType: "word_list" | "minimal_pairs";
  spellingPattern?: string;
  entries: Array<string | { left: string; right: string }>;
};

export type PronunciationData = LegacyPronunciationData | PronunciationBlockData;
