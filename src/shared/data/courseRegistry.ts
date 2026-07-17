import { pronunciationCourse } from "../content/courses/pronunciationCourse";
import { pronunciationUnits } from "../content/units/pronunciationUnits";
import { pronunciationLessons } from "../content/lessons/pronunciationLessons";
import { lessonData } from "../content/lessons";

export const courseRegistry = {
  courses: [pronunciationCourse],
  units: pronunciationUnits,
  lessons: pronunciationLessons,
  lessonData,
};
