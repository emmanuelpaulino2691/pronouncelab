import { lessonData } from "../data/lessons/index";

export function getLesson(id: number) {
  return lessonData[id];
}