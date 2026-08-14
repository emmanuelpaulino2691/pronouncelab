export type ReleaseSessionMode="play"|"summary"|"review"|"restart";
export function releaseLessonRuntimeKey(releaseId:string|undefined,releaseLessonId:string|undefined){return `release:${releaseId??"unknown"}:lesson:${releaseLessonId??"unknown"}`}
export function initialReleaseSessionMode(completed:boolean):ReleaseSessionMode{return completed?"summary":"play"}
export function completedActivityIdsForSession(mode:ReleaseSessionMode,authoritative:readonly string[]){return mode==="restart"?[]:[...authoritative]}
export function shouldWriteReleaseActivity(authoritativelyCompleted:boolean){return !authoritativelyCompleted}
export function shouldUseFinalReviewActions(currentActivity:number,totalActivities:number,hasFinalActions:boolean){return hasFinalActions&&totalActivities>0&&currentActivity===totalActivities-1}
