import { supabase } from "../../shared/lib/supabaseClient";

export type LearnerNotification = { id:number; type:"new_assignment"|"assignment_available"|"due_soon"|"assignment_late"; classId:number; assignmentId:number; releaseId:number; title:string; body:string; metadata:Record<string,unknown>; createdAt:string; readAt:string|null };
function client(){if(!supabase)throw new Error("Notifications are unavailable.");return supabase}
function fail(error:{message:string}|null){if(error)throw new Error("Notifications could not be loaded.")}
export async function listMyNotifications(){const{data,error}=await client().rpc("get_my_notifications",{requested_limit:100});fail(error);return(data??[]) as unknown as LearnerNotification[]}
export async function markNotificationRead(id:number){const{error}=await client().rpc("mark_notification_read",{requested_notification_id:id});fail(error)}
export async function markAllNotificationsRead(){const{error}=await client().rpc("mark_all_notifications_read");fail(error)}
export async function dismissNotification(id:number){const{error}=await client().rpc("dismiss_notification",{requested_notification_id:id});fail(error)}
export async function clearReadNotifications(){const{error}=await client().rpc("clear_read_notifications");fail(error)}
