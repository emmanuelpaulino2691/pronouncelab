import { supabase } from "../../../shared/lib/supabaseClient";
import type {
  CourseStatus,
} from "../courses/adminCourseService";
import type {
  HierarchyItemInput,
} from "../components/HierarchyItemForm";

export type AdminLesson = HierarchyItemInput & {
  id: number;
  unitId: number;
  status: CourseStatus;
  currentPublishedVersionId: number | null;
  createdAt: string;
  updatedAt: string;
};

type LessonRow = {
  id: number;
  unit_id: number;
  title: string;
  description: string;
  position: number;
  status: CourseStatus;
  current_published_version_id: number | null;
  created_at: string;
  updated_at: string;
};

const lessonColumns = [
  "id",
  "unit_id",
  "title",
  "description",
  "position",
  "status",
  "current_published_version_id",
  "created_at",
  "updated_at",
].join(",");

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
}

function toAdminLesson(
  row: LessonRow
): AdminLesson {
  return {
    id: row.id,
    unitId: row.unit_id,
    title: row.title,
    description: row.description,
    position: row.position,
    status: row.status,
    currentPublishedVersionId:
      row.current_published_version_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getCurrentUserId() {
  const {
    data: { user },
  } = await requireSupabase().auth.getUser();

  if (!user) {
    throw new Error("Your session has expired.");
  }

  return user.id;
}

export async function listAdminLessons(
  unitId: number
) {
  const { data, error } = await requireSupabase()
    .from("lessons")
    .select(lessonColumns)
    .eq("unit_id", unitId)
    .order("position", { ascending: true });

  if (error) {
    throw error;
  }

  return (data as unknown as LessonRow[]).map(
    toAdminLesson
  );
}

export async function getAdminLesson(
  lessonId: number,
  expectedUnitId: number
) {
  const { data, error } = await requireSupabase()
    .from("lessons")
    .select(lessonColumns)
    .eq("id", lessonId)
    .eq("unit_id", expectedUnitId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(
      "Lesson not found in the expected unit."
    );
  }

  return toAdminLesson(
    data as unknown as LessonRow
  );
}

export async function createAdminLesson(
  unitId: number,
  input: HierarchyItemInput
) {
  const userId = await getCurrentUserId();
  const { data, error } = await requireSupabase()
    .from("lessons")
    .insert({
      ...input,
      unit_id: unitId,
      status: "draft",
      current_published_version_id: null,
      created_by: userId,
      updated_by: userId,
    })
    .select(lessonColumns)
    .single();

  if (error) {
    throw error;
  }

  return toAdminLesson(
    data as unknown as LessonRow
  );
}

export async function updateAdminLesson(
  lessonId: number,
  expectedUnitId: number,
  input: HierarchyItemInput
) {
  const userId = await getCurrentUserId();
  const { data, error } = await requireSupabase()
    .from("lessons")
    .update({
      ...input,
      updated_by: userId,
    })
    .eq("id", lessonId)
    .eq("unit_id", expectedUnitId)
    .eq("status", "draft")
    .is("current_published_version_id", null)
    .select(lessonColumns)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(
      "Draft lesson not found in the expected unit, or it is no longer editable."
    );
  }

  return toAdminLesson(
    data as unknown as LessonRow
  );
}

export async function deleteDraftLesson(
  lessonId: number,
  expectedUnitId: number
) {
  const { data, error } = await requireSupabase().rpc(
    "delete_draft_lesson",
    {
      requested_lesson_id: lessonId,
      expected_unit_id: expectedUnitId,
    }
  );

  if (error) {
    throw error;
  }

  if (data !== lessonId) {
    throw new Error(
      "Draft lesson not found in the expected unit, or it is no longer deletable."
    );
  }
}

export async function duplicateDraftLesson(lessonId: number, expectedUnitId: number) {
  const { data, error } = await requireSupabase().rpc(
    "duplicate_draft_lesson",
    { requested_lesson_id: lessonId, expected_unit_id: expectedUnitId }
  );
  if (error) throw error;
  if (!data) throw new Error("The lesson could not be duplicated.");
  return toAdminLesson(data as unknown as LessonRow);
}
