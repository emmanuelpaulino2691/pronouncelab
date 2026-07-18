import { supabase } from "../../../../shared/lib/supabaseClient";
import type {
  ActivityType,
  LessonActivity,
  LessonVersion,
} from "../types";
import { defaultAiSpeakingMission } from "../../../ai-missions";

function client() {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }
  return supabase;
}

type VersionRow = {
  id: number;
  lesson_id: number;
  version_number: number;
  status: LessonVersion["status"];
};

type ActivityRow = {
  id: number;
  lesson_version_id: number;
  type: ActivityType;
  title: string;
  position: number;
  required: boolean;
  updated_at: string;
};

const activityColumns =
  "id,lesson_version_id,type,title,position,required,updated_at";

const toVersion = (row: VersionRow): LessonVersion => ({
  id: row.id,
  lessonId: row.lesson_id,
  versionNumber: row.version_number,
  status: row.status,
});

const toActivity = (
  row: ActivityRow
): LessonActivity => ({
  id: row.id,
  lessonVersionId: row.lesson_version_id,
  type: row.type,
  title: row.title,
  position: row.position,
  required: row.required,
  updatedAt: row.updated_at,
});

export async function loadLessonVersion(
  lessonId: number
) {
  const { data, error } = await client()
    .from("lesson_versions")
    .select("id,lesson_id,version_number,status")
    .eq("lesson_id", lessonId)
    .order("version_number", { ascending: false });
  if (error) throw error;
  const rows = data as unknown as VersionRow[];
  const row =
    rows.find((item) => item.status === "draft") ??
    rows[0];
  return row ? toVersion(row) : null;
}

export async function createDraftVersion(
  lessonId: number,
  expectedUnitId: number
) {
  const { data, error } = await client().rpc(
    "create_lesson_draft_version",
    {
      requested_lesson_id: lessonId,
      expected_unit_id: expectedUnitId,
    }
  );
  if (error) throw error;
  return toVersion(data as unknown as VersionRow);
}

export async function listActivities(
  lessonVersionId: number
) {
  const { data, error } = await client()
    .from("lesson_activities")
    .select(activityColumns)
    .eq("lesson_version_id", lessonVersionId)
    .order("position");
  if (error) throw error;
  return (data as unknown as ActivityRow[]).map(
    toActivity
  );
}

export async function createActivity(
  lessonVersionId: number,
  type: ActivityType,
  title: string
) {
  if (type === "ai_speaking_mission") {
    const { data, error } = await client().rpc(
      "create_draft_ai_speaking_mission",
      {
        requested_lesson_version_id: lessonVersionId,
        requested_title: title,
        requested_config: {
          ...defaultAiSpeakingMission,
          missionTitle: title,
        },
      }
    );
    if (error) throw error;
    return toActivity(data as unknown as ActivityRow);
  }
  const { data, error } = await client().rpc(
    "create_draft_lesson_activity",
    {
      requested_lesson_version_id:
        lessonVersionId,
      requested_type: type,
      requested_title: title,
    }
  );
  if (error) throw error;
  return toActivity(data as unknown as ActivityRow);
}

export async function updateActivity(
  activityId: number,
  expectedLessonVersionId: number,
  input: { title: string; required: boolean }
) {
  const title = input.title.trim();
  if (!title) throw new Error("Title is required.");
  const { data, error } = await client()
    .from("lesson_activities")
    .update({ title, required: input.required })
    .eq("id", activityId)
    .eq(
      "lesson_version_id",
      expectedLessonVersionId
    )
    .select(activityColumns)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new Error(
      "Draft activity not found in the expected lesson version."
    );
  }
  return toActivity(data as unknown as ActivityRow);
}

export async function deleteActivity(
  activityId: number,
  expectedLessonVersionId: number
) {
  const { data, error } = await client()
    .from("lesson_activities")
    .delete()
    .eq("id", activityId)
    .eq(
      "lesson_version_id",
      expectedLessonVersionId
    )
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new Error(
      "Draft activity not found in the expected lesson version."
    );
  }
}

export async function duplicateActivity(
  activityId: number,
  expectedLessonVersionId: number,
  type: ActivityType
) {
  if (type === "ai_speaking_mission") {
    const { data, error } = await client().rpc(
      "duplicate_draft_ai_speaking_mission",
      {
        requested_activity_id: activityId,
        expected_lesson_version_id: expectedLessonVersionId,
      }
    );
    if (error) throw error;
    return toActivity(data as unknown as ActivityRow);
  }
  const { data, error } = await client().rpc(
    "duplicate_draft_lesson_activity",
    {
      requested_activity_id: activityId,
      expected_lesson_version_id:
        expectedLessonVersionId,
    }
  );
  if (error) throw error;
  return toActivity(data as unknown as ActivityRow);
}

export async function reorderActivities(
  lessonVersionId: number,
  activityIds: number[]
) {
  const { data, error } = await client().rpc(
    "reorder_draft_lesson_activities",
    {
      requested_lesson_version_id:
        lessonVersionId,
      ordered_activity_ids: activityIds,
    }
  );
  if (error) throw error;
  return (data as unknown as ActivityRow[]).map(
    toActivity
  );
}
