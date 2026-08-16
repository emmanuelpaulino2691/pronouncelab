import type { LearnerCourse } from "../../shared/content/contracts/learnerContent";
import type { ServerLearnerProgress } from "../../shared/progress/learnerProgressSync";

export function publicLibraryCourses(courses:readonly LearnerCourse[]){return courses.filter(course=>course.visibility==="public")}

export function mostRecentIndependentPractice(courses:readonly LearnerCourse[],server:ServerLearnerProgress|null){
  if(!server)return null;
  const lessons=new Map<string,{course:LearnerCourse;unit:LearnerCourse["units"][number];lesson:LearnerCourse["units"][number]["lessons"][number]}>(courses.flatMap(course=>course.units.flatMap(unit=>unit.lessons.map(lesson=>[String(lesson.id),{course,unit,lesson}]))));
  const recent=[...server.lessons].filter(row=>lessons.has(row.lessonId)).sort((left,right)=>right.lastAccessedAt.localeCompare(left.lastAccessedAt))[0];
  if(!recent)return null;
  const context=lessons.get(recent.lessonId)!;
  const activityPosition=recent.lastActivityId?server.activities.find(activity=>activity.lessonId===recent.lessonId&&activity.activityId===recent.lastActivityId)?.position:null;
  return{...context,activityPosition:activityPosition??0,href:`/lessons/${recent.lessonId}?activity=${activityPosition??0}`};
}
