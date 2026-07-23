import { supabase } from "../../../../shared/lib/supabaseClient";
import type {
  InteractivePracticeConfig,
  InteractivePracticeMode,
} from "../interactivePractice";

export type InteractivePracticeRecord = {
  activityId: number;
  mode: InteractivePracticeMode;
  instructions: string;
  explanation: string;
  config: InteractivePracticeConfig;
  updatedAt: string;
};

type InteractivePracticeRow = {
  activity_id: number;
  mode: InteractivePracticeMode;
  instructions: string | null;
  explanation: string | null;
  config: InteractivePracticeConfig;
  updated_at: string;
};

const columns =
  "activity_id,mode,instructions,explanation,config,updated_at";

function client() {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }
  return supabase;
}

function toInteractivePractice(
  row: InteractivePracticeRow
): InteractivePracticeRecord {
  return {
    activityId: row.activity_id,
    mode: row.mode,
    instructions: row.instructions ?? "",
    explanation: row.explanation ?? "",
    config: row.config,
    updatedAt: row.updated_at,
  };
}

export async function getInteractivePractice(
  activityId: number
) {
  const { data, error } = await client()
    .from("interactive_practice_exercises")
    .select(columns)
    .eq("activity_id", activityId)
    .single();
  if (error) throw error;
  return toInteractivePractice(
    data as unknown as InteractivePracticeRow
  );
}

export async function saveInteractivePractice(
  value: InteractivePracticeRecord
) {
  const { data, error } = await client().rpc(
    "save_draft_interactive_practice",
    {
      requested_activity_id: value.activityId,
      expected_updated_at: value.updatedAt,
      requested_mode: value.mode,
      requested_instructions: value.instructions,
      requested_explanation: value.explanation,
      requested_config: value.config,
    }
  );
  if (error) throw error;
  return toInteractivePractice(
    data as unknown as InteractivePracticeRow
  );
}
