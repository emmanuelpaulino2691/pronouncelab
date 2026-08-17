import { supabase } from "../../shared/lib/supabaseClient";

export async function redeemUnlistedCourseLink(token:string){
  if(!supabase)throw new Error("Course Library is unavailable.");
  const{data,error}=await supabase.rpc("redeem_unlisted_course_link",{requested_token:token});
  if(error)throw error;
  return Number(data);
}

