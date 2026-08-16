import type{LearnerCourse}from"../../shared/content/contracts/learnerContent";import type{UserProgress}from"../../shared/types/UserProgress";import{isLearnerLessonUnlocked,isLearnerUnitUnlocked}from"../learner-journey/learnerJourney";
export function orderedPublicLessonIds(course:LearnerCourse){return course.units.flatMap(unit=>unit.lessons.map(lesson=>lesson.id))}
export function resolveNextPublicLesson(course:LearnerCourse,currentLessonId:string,progress:UserProgress){const ids=orderedPublicLessonIds(course);const next=ids[ids.indexOf(currentLessonId as never)+1];if(!next)return null;const unit=course.units.find(item=>item.lessons.some(lesson=>lesson.id===next));return unit&&isLearnerUnitUnlocked(course,unit.id,progress)&&isLearnerLessonUnlocked(unit,next,progress)?next:null}

