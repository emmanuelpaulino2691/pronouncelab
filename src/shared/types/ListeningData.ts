import type { ListeningQuestion } from "./ListeningQuestion";

export type ListeningData = {
  id: number;
  title: string;
  audio: string;

  instructions?: string;

  transcript?: string;

  transcriptButtonText?: string;

  questions?: ListeningQuestion[];
};