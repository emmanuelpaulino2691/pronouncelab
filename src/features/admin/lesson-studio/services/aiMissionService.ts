import { supabase } from "../../../../shared/lib/supabaseClient";
import type { AiSpeakingMissionData } from "../../../ai-missions";

type MissionRow = {
  id: number;
  activity_id: number;
  config: AiSpeakingMissionData;
  updated_at: string;
};

function client() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

export async function getAiMission(activityId: number) {
  const { data, error } = await client().from("ai_speaking_missions")
    .select("id,activity_id,config,updated_at")
    .eq("activity_id", activityId).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("AI speaking mission content was not found.");
  return data as unknown as MissionRow;
}

export async function saveAiMission(missionId: number, expectedActivityId: number, config: AiSpeakingMissionData) {
  const { data, error } = await client().from("ai_speaking_missions")
    .update({ config }).eq("id", missionId).eq("activity_id", expectedActivityId)
    .select("id,activity_id,config,updated_at").maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("The mission is stale, sealed, unavailable, or no longer belongs to this activity.");
  return data as unknown as MissionRow;
}
