import type { Activity } from "./Activity";
import type { MultipleChoiceQuestion } from "./MultipleChoiceQuestion";

export type PracticeData = Activity & {
  instructions?: string;
  questions?: MultipleChoiceQuestion[];
};