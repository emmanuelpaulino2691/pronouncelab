export type LessonActivityType =
  | "theory"
  | "listening"
  | "pronunciation"
  | "practice"
  | "quiz"
  | "ai_speaking_mission";

export type LessonActivity = {
  id: number;
  title: string;
  type: LessonActivityType;
};
