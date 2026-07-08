export type LessonContent = {
  id: number;
  lessonId: number;
  title: string;
  type:
    | "theory"
    | "listening"
    | "pronunciation"
    | "practice"
    | "quiz";
};