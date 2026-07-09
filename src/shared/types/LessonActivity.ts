export type LessonActivityType =
  | "theory"
  | "listening"
  | "pronunciation"
  | "practice"
  | "quiz";

export type LessonActivity = {
  id: number;
  title: string;
  type: LessonActivityType;
};