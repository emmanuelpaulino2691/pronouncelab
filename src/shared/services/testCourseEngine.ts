import {
  getCourses,
  getUnitsByCourse,
  getLessonsByUnit,
} from "./courseEngineService";

console.log(getCourses());

console.log(getUnitsByCourse(1));

console.log(getLessonsByUnit(1));