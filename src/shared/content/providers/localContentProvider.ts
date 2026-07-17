import { courseRegistry } from "../../data/courseRegistry";

export const contentProvider = {
  getCourses: () => courseRegistry.courses,
  getUnits: () => courseRegistry.units,
  getLessons: () => courseRegistry.lessons,
  getLessonData: () => courseRegistry.lessonData,
};
