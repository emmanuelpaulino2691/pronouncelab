import { supabase } from "../../shared/lib/supabaseClient";

export type ClassRecord = { id: number; name: string; description: string; status: "active" | "archived"; join_code: string; join_code_enabled: boolean; owner_user_id: string };
export type EnrollmentRecord = { class_id: number; learner_user_id: string; status: "active" | "inactive"; joined_at: string; classes: { name: string; description: string } | null };
export type RosterMember = { learnerId: string; email: string; status: "active" | "inactive"; joinedAt: string };
export type ProgressSummary = { learnerId: string; email: string; startedLessons: number; completedLessons: number; lastAccessedAt: string | null };

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
export async function updateClass(id: number, name: string, description: string, status: "active" | "archived") {
  const { error } = await client().rpc("update_owned_class", { requested_class_id: id, requested_name: name, requested_description: description, requested_status: status }); fail(error);
}
export async function regenerateJoinCode(id: number) { const { data, error } = await client().rpc("regenerate_class_join_code", { requested_class_id: id }); fail(error); return String(data); }
export async function getRoster(id: number) { const { data, error } = await client().rpc("get_owned_class_roster", { requested_class_id: id }); fail(error); return (data ?? []) as unknown as RosterMember[]; }
export async function getClassProgress(id: number) { const { data, error } = await client().rpc("get_enrolled_learner_progress_summary", { requested_class_id: id }); fail(error); return (data ?? []) as unknown as ProgressSummary[]; }
export async function setEnrollmentActive(id: number, learnerId: string, active: boolean) { const { error } = await client().rpc("set_class_enrollment_active", { requested_class_id: id, requested_learner_id: learnerId, requested_active: active }); fail(error); }
export async function joinClass(code: string) { const { data, error } = await client().rpc("join_class", { requested_join_code: code }); fail(error); return Number(data); }
export async function listMyMemberships() { const { data, error } = await client().from("class_enrollments").select("class_id,learner_user_id,status,joined_at,classes(name,description)").eq("status", "active"); fail(error); return (data ?? []) as unknown as EnrollmentRecord[]; }
