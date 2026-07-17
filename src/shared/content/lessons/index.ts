import type { LessonData } from "../../types/LessonData";
import { lesson1 } from "./lesson1";
import { lesson2 } from "./lesson2";

export const lessonData: Record<number, LessonData> = {
  1: lesson1,
  2: lesson2,
};
