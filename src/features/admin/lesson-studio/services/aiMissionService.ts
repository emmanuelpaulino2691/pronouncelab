import { supabase } from "../../../../shared/lib/supabaseClient";
import type { AiSpeakingMissionData } from "../../../ai-missions";

type MissionRow = {
  id: number;
  activity_id: number;
  config: AiSpeakingMissionData;
  updated_at: string;
};

export class AiMissionConflictError extends Error {
  constructor() {
    super(
      "This mission changed in another editor. The latest version has been loaded; review it before saving again."
    );
    this.name = "AiMissionConflictError";
  }
}

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

export async function saveAiMission(
  missionId: number,
  expectedActivityId: number,
  expectedUpdatedAt: string,
  config: AiSpeakingMissionData
) {
  const { data, error } = await client().rpc(
    "save_draft_ai_speaking_mission",
    {
      requested_mission_id: missionId,
      expected_activity_id: expectedActivityId,
      expected_updated_at: expectedUpdatedAt,
      requested_config: config,
    }
  );
  if (error?.code === "40001") {
    throw new AiMissionConflictError();
  }
  if (error) throw error;
  if (!data) {
    throw new Error(
      "The mission is sealed, unavailable, or no longer belongs to this activity."
    );
  }
  return data as unknown as MissionRow;
}
