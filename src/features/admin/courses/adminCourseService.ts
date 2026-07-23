import {
  supabase,
} from "../../../shared/lib/supabaseClient";

export type CourseStatus =
  | "draft"
  | "published"
  | "unpublished"
  | "archived";

export type AdminCourse = {
  id: number;
  slug: string;
  title: string;
  description: string;
  level: string;
  emoji: string;
  position: number;
  status: CourseStatus;
  createdAt: string;
  updatedAt: string;
};

export type CourseInput = {
  slug: string;
  title: string;
  description: string;
  level: string;
  emoji: string;
  position: number;
};

type CourseRow = {
  id: number;
  slug: string;
  title: string;
  description: string;
  level: string;
  emoji: string;
  position: number;
  status: CourseStatus;
  created_at: string;
  updated_at: string;
};

const courseColumns = [
  "id",
  "slug",
  "title",
  "description",
  "level",
  "emoji",
  "position",
  "status",
  "created_at",
  "updated_at",
].join(",");

function requireSupabase() {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured."
    );
  }

  return supabase;
}

function toAdminCourse(
  row: CourseRow
): AdminCourse {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    level: row.level,
    emoji: row.emoji,
    position: row.position,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listAdminCourses() {
  const client = requireSupabase();
  const { data, error } = await client
    .from("courses")
    .select(courseColumns)
    .order("position", { ascending: true });

  if (error) {
    throw error;
  }

  return (data as unknown as CourseRow[]).map(
    toAdminCourse
  );
}

export async function getAdminCourse(
  courseId: number
) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("courses")
    .select(courseColumns)
    .eq("id", courseId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Course not found.");
  }

  return toAdminCourse(
    data as unknown as CourseRow
  );
}

export async function createAdminCourse(
  input: CourseInput
) {
  const client = requireSupabase();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    throw new Error(
      "Your session has expired."
    );
  }

  const { data, error } = await client
    .from("courses")
    .insert({
      ...input,
      status: "draft",
      created_by: user.id,
      updated_by: user.id,
    })
    .select(courseColumns)
    .single();

  if (error) {
    throw error;
  }

  return toAdminCourse(
    data as unknown as CourseRow
  );
}

export async function updateAdminCourse(
  courseId: number,
  input: CourseInput
) {
  const client = requireSupabase();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    throw new Error(
      "Your session has expired."
    );
  }

  const { data, error } = await client
    .from("courses")
    .update({
      ...input,
      updated_by: user.id,
    })
    .eq("id", courseId)
    .eq("status", "draft")
    .select(courseColumns)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(
      "Only draft courses can be edited."
    );
  }

  return toAdminCourse(
    data as unknown as CourseRow
  );
}

export async function deleteDraftCourse(
  courseId: number
) {
  const { data, error } = await requireSupabase().rpc(
    "delete_draft_course",
    { requested_course_id: courseId }
  );

  if (error) {
    throw error;
  }

  if (data !== courseId) {
    throw new Error(
      "Only draft courses can be deleted."
    );
  }
}
