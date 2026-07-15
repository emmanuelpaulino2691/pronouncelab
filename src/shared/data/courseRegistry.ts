import { pronunciationCourse } from "./courses/pronunciationCourse";
import { pronunciationUnits } from "./units/pronunciationUnits";
import { pronunciationLessons } from "./lessons-v2/pronunciationLessons";
import { lessonData } from "./lessons/index";

export const courseRegistry = {
  courses: [pronunciationCourse],
  units: pronunciationUnits,
  lessons: pronunciationLessons,
  lessonData,
};
