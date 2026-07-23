import { supabase } from "../../../shared/lib/supabaseClient";
import type {
  CourseStatus,
} from "../courses/adminCourseService";
import type {
  HierarchyItemInput,
} from "../components/HierarchyItemForm";

export type AdminUnit = HierarchyItemInput & {
  id: number;
  courseId: number;
  status: CourseStatus;
  createdAt: string;
  updatedAt: string;
};

type UnitRow = {
  id: number;
  course_id: number;
  title: string;
  description: string;
  position: number;
  status: CourseStatus;
  created_at: string;
  updated_at: string;
};

const unitColumns = [
  "id",
  "course_id",
  "title",
  "description",
  "position",
  "status",
  "created_at",
  "updated_at",
].join(",");

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
}

function toAdminUnit(row: UnitRow): AdminUnit {
  return {
    id: row.id,
    courseId: row.course_id,
    title: row.title,
    description: row.description,
    position: row.position,
    status: row.status,
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

export async function listAdminUnits(
  courseId: number
) {
  const { data, error } = await requireSupabase()
    .from("units")
    .select(unitColumns)
    .eq("course_id", courseId)
    .order("position", { ascending: true });

  if (error) {
    throw error;
  }

  return (data as unknown as UnitRow[]).map(
    toAdminUnit
  );
}

export async function getAdminUnit(
  unitId: number,
  expectedCourseId: number
) {
  const { data, error } = await requireSupabase()
    .from("units")
    .select(unitColumns)
    .eq("id", unitId)
    .eq("course_id", expectedCourseId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(
      "Unit not found in the expected course."
    );
  }

  return toAdminUnit(data as unknown as UnitRow);
}

export async function createAdminUnit(
  courseId: number,
  input: HierarchyItemInput
) {
  const userId = await getCurrentUserId();
  const { data, error } = await requireSupabase()
    .from("units")
    .insert({
      ...input,
      course_id: courseId,
      status: "draft",
      created_by: userId,
      updated_by: userId,
    })
    .select(unitColumns)
    .single();

  if (error) {
    throw error;
  }

  return toAdminUnit(data as unknown as UnitRow);
}

export async function updateAdminUnit(
  unitId: number,
  expectedCourseId: number,
  input: HierarchyItemInput
) {
  const userId = await getCurrentUserId();
  const { data, error } = await requireSupabase()
    .from("units")
    .update({
      ...input,
      updated_by: userId,
    })
    .eq("id", unitId)
    .eq("course_id", expectedCourseId)
    .eq("status", "draft")
    .select(unitColumns)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(
      "Draft unit not found in the expected course, or it is no longer editable."
    );
  }

  return toAdminUnit(data as unknown as UnitRow);
}

export async function deleteDraftUnit(
  unitId: number,
  expectedCourseId: number
) {
  const { data, error } = await requireSupabase().rpc(
    "delete_draft_unit",
    {
      requested_unit_id: unitId,
      expected_course_id: expectedCourseId,
    }
  );

  if (error) {
    throw error;
  }

  if (data !== unitId) {
    throw new Error(
      "Draft unit not found in the expected course, or it is no longer deletable."
    );
  }
}
