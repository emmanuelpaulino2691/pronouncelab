import type { LessonData } from "../../types/LessonData";
import { lesson1 } from "./lesson1";
import { lesson2 } from "./lesson2";
import { lesson3 } from "./lesson3";

export const lessonData: Record<number, LessonData> = {
  1: lesson1,
  2: lesson2,
  3: lesson3,
};
