import { courseRegistry } from "../data/courseRegistry";


export function getCourse(id:number){

  return courseRegistry.courses.find(
    course => course.id === id
  );

}


export function getUnitsByCourse(
  courseId:number
){

  return courseRegistry.units.filter(
    unit => unit.courseId === courseId
  );

}


export function getLessonsByUnit(
  unitId:number
){

  return courseRegistry.lessons.filter(
    lesson => lesson.unitId === unitId
  );

}