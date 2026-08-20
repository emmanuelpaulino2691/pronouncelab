import { supabase } from "../../shared/lib/supabaseClient";
export type ClassAnnouncement = { id:number; classId:number; title:string; body:string; revision:number; publishedAt:string; editedAt:string|null; withdrawnAt:string|null; readAt:string|null; readRevision:number|null; readCount:number; activeLearners:number };
function client(){if(!supabase)throw new Error("Announcements are unavailable.");return supabase}
function fail(error:{message:string}|null){if(error)throw new Error("Announcements could not be loaded.")}
export async function listClassAnnouncements(classId:number){const{data,error}=await client().rpc("get_class_announcements",{requested_class_id:classId});fail(error);return(data??[])as unknown as ClassAnnouncement[]}
export async function markClassAnnouncementRead(id:number){const{error}=await client().rpc("mark_class_announcement_read",{requested_announcement_id:id});fail(error)}
export async function markAllClassAnnouncementsRead(classId:number){const{error}=await client().rpc("mark_all_class_announcements_read",{requested_class_id:classId});fail(error)}
export async function publishClassAnnouncement(classId:number,title:string,body:string){const{data,error}=await client().rpc("publish_class_announcement",{requested_class_id:classId,requested_title:title,requested_body:body});fail(error);return Number(data)}
export async function editClassAnnouncement(id:number,title:string,body:string){const{error}=await client().rpc("edit_class_announcement",{requested_announcement_id:id,requested_title:title,requested_body:body});fail(error)}
export async function withdrawClassAnnouncement(id:number){const{error}=await client().rpc("withdraw_class_announcement",{requested_announcement_id:id});fail(error)}
