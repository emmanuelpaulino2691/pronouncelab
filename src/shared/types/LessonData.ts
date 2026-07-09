import type { TheoryBlock } from "./TheoryBlock";

export type LessonData = {
  id: number;
  title: string;
  description: string;

  theory: TheoryBlock[];
};