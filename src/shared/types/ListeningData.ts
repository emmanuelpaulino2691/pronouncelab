import type { Activity } from "./Activity";
import type { ListeningQuestion } from "./ListeningQuestion";

export type ListeningData = Activity & {
  audio: string;

  instructions?: string;

  transcript?: string;

  questions?: ListeningQuestion[];
};