import { supabase } from "../../shared/lib/supabaseClient";

export type ReleaseLesson = { id:number; sourceLessonId:number; lessonVersionId:number; position:number; title:string; description:string };
export type ReleaseUnit = { id:number; sourceUnitId:number; position:number; title:string; description:string; lessons:ReleaseLesson[] };
export type CourseReleaseManifest = { id:number; courseId:number; releaseNumber:number; title:string; description:string; level:string; emoji:string; releasedAt:string; fingerprint:string; units:ReleaseUnit[] };
export type ReleaseLessonState = { releaseLessonId:number; lessonVersionId:number; startedAt:string|null; completedAt:string|null; lastAccessedAt:string|null; eligible:boolean; state:"available"|"completed"|"locked" };
export type ReleaseProgress = { lessons:ReleaseLessonState[]; activities:Array<{releaseLessonId:number;activityId:number;completedAt:string}> };
export type ReleaseLessonPayload = { schemaVersion:1;courseReleaseId:number;releaseLessonId:number;lessonRevision:string;locked?:false;lesson:{id:string;unitId:string;title:string;description:string;currentVersionId:string;versionNumber:number;publishedAt:string;activities:unknown[]} } | { schemaVersion:1;courseReleaseId:number;releaseLessonId:number;locked:true;error:{code:"release_lesson_locked";message:string};lesson:null };

export class ReleaseRuntimeError extends Error { readonly code:string; constructor(code:string,message:string){super(message);this.code=code} }
function client(){if(!supabase)throw new ReleaseRuntimeError("unavailable","Release learning is unavailable.");return supabase}
export async function getReleaseManifest(id:number){const{data,error}=await client().rpc("get_course_release_manifest",{requested_release_id:id});if(error)throw new ReleaseRuntimeError(error.code,"Course Release is unavailable.");return data as unknown as CourseReleaseManifest}
export async function getReleaseProgress(id:number){const{data,error}=await client().rpc("get_my_course_release_progress",{requested_release_id:id});if(error)throw new ReleaseRuntimeError(error.code,"Release progress is unavailable.");return data as unknown as ReleaseProgress}
export async function getReleaseLesson(id:number){const{data,error}=await client().rpc("get_course_release_lesson",{requested_release_lesson_id:id,requested_schema_version:1});if(error)throw new ReleaseRuntimeError(error.code,"Course Release Lesson is unavailable.");return data as unknown as ReleaseLessonPayload}
export async function completeReleaseActivity(releaseLessonId:number,activityId:number){const{error}=await client().rpc("record_release_activity_completion",{requested_release_lesson_id:releaseLessonId,requested_activity_id:activityId});if(error)throw new ReleaseRuntimeError(error.code,error.code==="PLR03"?"Complete the previous lesson first.":"Release progress could not be saved.")}
