import type{CourseReleaseManifest,ReleaseProgress}from"./releaseService";

export type ReleaseNavigation={completed:number;total:number;percent:number;continueLessonId:number|null;complete:boolean};

export function orderedReleaseLessonIds(manifest:CourseReleaseManifest){return manifest.units.flatMap(unit=>unit.lessons.map(lesson=>lesson.id))}

export function resolveReleaseNavigation(manifest:CourseReleaseManifest,progress:ReleaseProgress):ReleaseNavigation{
  const ids=orderedReleaseLessonIds(manifest);const states=new Map(progress.lessons.map(state=>[state.releaseLessonId,state]));
  const completed=ids.filter(id=>states.get(id)?.state==="completed").length;
  const partial=ids.find(id=>{const state=states.get(id);return state?.state==="available"&&state.startedAt!==null});
  const available=ids.find(id=>states.get(id)?.state==="available");
  return{completed,total:ids.length,percent:ids.length===0?0:Math.round(completed*100/ids.length),continueLessonId:partial??available??null,complete:ids.length>0&&completed===ids.length};
}

export function resolveNextReleaseLesson(manifest:CourseReleaseManifest,progress:ReleaseProgress,currentLessonId:number){const ids=orderedReleaseLessonIds(manifest);const next=ids[ids.indexOf(currentLessonId)+1];return next!==undefined&&progress.lessons.find(state=>state.releaseLessonId===next)?.state==="available"?next:null}

export function releaseContextSearch(classId:string|null){return classId&&/^\d+$/.test(classId)?`?classId=${classId}`:""}

export function assignmentContinuePresentation(releaseId:number,classId:number,navigation:ReleaseNavigation){return{label:navigation.complete?"Review Course":"Open Course",href:`/releases/${releaseId}?classId=${classId}`,progressLabel:`${navigation.completed} of ${navigation.total} Lessons completed · ${navigation.percent}%`}}
