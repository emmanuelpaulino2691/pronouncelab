import {
  supabase,
} from "../../../shared/lib/supabaseClient";
import type { CourseStatus } from "../../../domain/shared/constants";

export type { CourseStatus } from "../../../domain/shared/constants";

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
  learnerVisibility: "class_only" | "unlisted" | "public";
};

export type CourseInput = {
  slug: string;
  title: string;
  description: string;
  level: string;
  emoji: string;
  position: number;
};

export type CoursePublicationError = {
  courseId?: number;
  courseTitle?: string;
  unitId?: number;
  unitTitle?: string;
  lessonId?: number;
  lessonTitle?: string;
  lessonVersionId?: number;
  activityId?: number;
  activityTitle?: string;
  activityType?: string;
  category: string;
  message: string;
};

export type CoursePublicationResult =
  | { ok: true; courseId: number; publishedLessons: number; unchangedLessons: number; archivedVersions: number; publishedAt: string }
  | { ok: false; courseId: number; errors: CoursePublicationError[] };

export function isMissingCoursePublicationRpcError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: unknown; status?: unknown; message?: unknown };
  return candidate.code === "PGRST202"
    || candidate.status === 404
    || (typeof candidate.message === "string" && /function .*publish_course.*not found|could not find the function/i.test(candidate.message));
}

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
  learner_visibility: "class_only" | "unlisted" | "public";
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
  "learner_visibility",
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
    learnerVisibility: row.learner_visibility,
  };
}

export async function listAdminCourses() {
  const client = requireSupabase();
  const { data, error } = await client
    .from("courses")
    .select(courseColumns)
    .order("position", { ascending: true })
    .order("id", { ascending: true });

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

export async function removeAdminCourse(
  courseId: number
) {
  const { data, error } = await requireSupabase().rpc(
    "remove_authoring_course",
    { requested_course_id: courseId }
  );

  if (error) {
    throw error;
  }

  if (data !== courseId) {
    throw new Error(
      "The course could not be removed."
    );
  }
}

export async function duplicateDraftCourse(courseId: number) {
  const { data, error } = await requireSupabase().rpc(
    "duplicate_draft_course",
    { requested_course_id: courseId }
  );
  if (error) throw error;
  if (!data) throw new Error("The course could not be duplicated.");
  return toAdminCourse(data as unknown as CourseRow);
}

export async function publishAdminCourse(courseId: number): Promise<CoursePublicationResult> {
  const { data, error } = await requireSupabase().functions.invoke("publish-content", {
    body: { scope: "course", id: courseId },
  });
  if (error) throw error;
  if (!data || typeof data !== "object") {
    throw new Error("The course publication response was not recognised.");
  }
  const result = data as CoursePublicationResult;
  if (result.ok === false && Array.isArray(result.errors)) return result;
  if (result.ok === true && typeof result.publishedLessons === "number") return result;
  throw new Error("The course publication response was not recognised.");
}

export async function setAdminCourseVisibility(courseId:number,visibility:AdminCourse["learnerVisibility"]){
  const{data,error}=await requireSupabase().rpc("set_course_learner_visibility",{requested_course_id:courseId,requested_visibility:visibility});
  if(error)throw error;
  return data as unknown as{courseId:number;visibility:AdminCourse["learnerVisibility"];shareToken:string|null};
}

export async function regenerateAdminCourseShareLink(courseId:number){
  const{data,error}=await requireSupabase().rpc("regenerate_course_unlisted_share_link",{requested_course_id:courseId});
  if(error)throw error;
  return String(data);
}
