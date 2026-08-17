import { supabase } from "../../shared/lib/supabaseClient";

export type ClassRecord = { id: number; name: string; description: string; status: "active" | "archived"; join_code: string; join_code_enabled: boolean; owner_user_id: string; timezone?: string };
export type EnrollmentRecord = { class_id: number; learner_user_id: string; status: "active" | "inactive"; joined_at: string; classes: { name: string; description: string } | null };
export type RosterMember = { learnerId: string; email: string; status: "active" | "inactive"; joinedAt: string };
export type ProgressSummary = { learnerId: string; email: string; startedLessons: number; completedLessons: number; lastAccessedAt: string | null };
export type CourseReleaseOption = { releaseId:number; courseId:number; courseTitle:string; courseDescription:string; courseLevel:string; releaseNumber:number; releasedAt:string; isLatest:boolean };
export type ClassCourseAssignment = { assignmentId:number; classId:number; releaseId:number; courseId:number; courseTitle:string; courseDescription:string; courseLevel:string; releaseNumber:number; latestReleaseNumber:number; assignedAt:string; endedAt:string|null; status:"active"|"inactive"; availableAt?:string|null; dueAt?:string|null; classTimezone?:string };
export type AssignmentProgressLearner = { learnerId:string; email:string; startedLessons:number; completedLessons:number; completionPercent:number; lastAccessedAt:string|null };
export type AssignmentProgress = { assignmentId:number; releaseId:number; courseTitle:string; releaseNumber:number; totalLessons:number; availableAt?:string|null; dueAt?:string|null; classTimezone?:string; learners:AssignmentProgressLearner[] };

function client() { if (!supabase) throw new Error("Classes are unavailable."); return supabase; }
function fail(error: { message: string } | null) { if (error) throw new Error("The class request could not be completed."); }

export async function listOwnedClasses() {
  const { data, error } = await client().from("classes").select("*").order("updated_at", { ascending: false }); fail(error); return (data ?? []) as ClassRecord[];
}
export async function createClass(name: string, description: string) {
  const { data, error } = await client().rpc("create_class", { requested_name: name, requested_description: description }); fail(error); return Number(data);
}
export async function getOwnedClass(id: number) {
  const { data, error } = await client().from("classes").select("*").eq("id", id).single(); fail(error); return data as ClassRecord;
}
export async function updateClass(id: number, name: string, description: string, status: "active" | "archived", timezone = "UTC") {
  const { error } = await client().rpc("update_owned_class", { requested_class_id: id, requested_name: name, requested_description: description, requested_status: status, requested_timezone: timezone }); fail(error);
}
export async function regenerateJoinCode(id: number) { const { data, error } = await client().rpc("regenerate_class_join_code", { requested_class_id: id }); fail(error); return String(data); }
export async function getRoster(id: number) { const { data, error } = await client().rpc("get_owned_class_roster", { requested_class_id: id }); fail(error); return (data ?? []) as unknown as RosterMember[]; }
export async function getClassProgress(id: number) { const { data, error } = await client().rpc("get_enrolled_learner_progress_summary", { requested_class_id: id }); fail(error); return (data ?? []) as unknown as ProgressSummary[]; }
export async function setEnrollmentActive(id: number, learnerId: string, active: boolean) { const { error } = await client().rpc("set_class_enrollment_active", { requested_class_id: id, requested_learner_id: learnerId, requested_active: active }); fail(error); }
export async function joinClass(code: string) { const { data, error } = await client().rpc("join_class", { requested_join_code: code }); fail(error); return Number(data); }
export async function listMyMemberships() { const { data, error } = await client().from("class_enrollments").select("class_id,learner_user_id,status,joined_at,classes(name,description)").eq("status", "active"); fail(error); return (data ?? []) as unknown as EnrollmentRecord[]; }
export async function listAssignableCourseReleases(){const{data,error}=await client().rpc("list_assignable_course_releases");fail(error);return(data??[])as unknown as CourseReleaseOption[]}
export async function listClassCourseAssignments(classId:number){const{data,error}=await client().rpc("get_class_course_assignments",{requested_class_id:classId});fail(error);return(data??[])as unknown as ClassCourseAssignment[]}
export async function assignClassCourseRelease(classId:number,releaseId:number,availableAt:string|null=null,dueAt:string|null=null){const{data,error}=await client().rpc("assign_class_course_release",{requested_class_id:classId,requested_release_id:releaseId,requested_available_at:availableAt,requested_due_at:dueAt});fail(error);return Number(data)}
export async function updateClassCourseRelease(classId:number,releaseId:number){const{data,error}=await client().rpc("assign_class_course_release",{requested_class_id:classId,requested_release_id:releaseId});fail(error);return Number(data)}
export async function updateClassCourseAssignmentSchedule(assignmentId:number,availableAt:string|null,dueAt:string|null){const{error}=await client().rpc("update_class_course_assignment_schedule",{requested_assignment_id:assignmentId,requested_available_at:availableAt,requested_due_at:dueAt});fail(error)}
export async function deactivateClassCourseAssignment(assignmentId:number){const{error}=await client().rpc("deactivate_class_course_assignment",{requested_assignment_id:assignmentId});fail(error)}
export async function getClassAssignmentProgress(assignmentId:number){const{data,error}=await client().rpc("get_class_assignment_progress",{requested_assignment_id:assignmentId});fail(error);return data as unknown as AssignmentProgress}
