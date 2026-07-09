import type { TheoryBlock } from "./TheoryBlock";
import type { LessonActivity } from "./LessonActivity";
import type { ListeningData } from "./ListeningData";
import type { PronunciationData } from "./PronunciationData";
import type { PracticeData } from "./PracticeData";
import type { QuizData } from "./QuizData";

export type LessonData = {
  id: number;
  title: string;
  description: string;

  activities: LessonActivity[];

  theory: TheoryBlock[];

  listening?: ListeningData[];

  pronunciation?: PronunciationData[];

  practice?: PracticeData[];

  quiz?: QuizData[];
};