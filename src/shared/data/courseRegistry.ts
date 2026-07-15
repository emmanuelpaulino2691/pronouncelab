import { pronunciationCourse } from "./courses/pronunciationCourse";

import { pronunciationUnits } from "./units/pronunciationUnits";

import { pronunciationLessons } from "./lessons-v2/pronunciationLessons";


export const courseRegistry = {

  courses: [
    pronunciationCourse,
  ],


  units:
    pronunciationUnits,


  lessons:
    pronunciationLessons,

};