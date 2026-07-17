import type { MultipleChoiceQuestion } from "./MultipleChoiceQuestion";

export type QuizData = {
  id: number;
  title: string;
  questions: string[];
  interactiveQuestions?: MultipleChoiceQuestion[];
};
