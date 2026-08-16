import { getAdminCourse } from "../courses/adminCourseService";
import { listAdminUnits } from "../units/adminUnitService";
import { getAdminLesson, listAdminLessons } from "../lessons/adminLessonService";
import { listActivities, loadLessonVersion } from "../lesson-studio/services/lessonStudioService";
import { getAssessment, listQuestions, listListeningItems, listPronunciationItems, listTheoryBlocks } from "../lesson-studio/services/activityContentService";
import { getAiMission } from "../lesson-studio/services/aiMissionService";
import { getListeningAudioAsset } from "../lesson-studio/services/listeningMediaService";
import { getLearnMediaAsset } from "../lesson-studio/services/learnMediaService";
import type { LearnerCourse, LearnerLesson, LearnerUnit } from "../../../shared/content/contracts/learnerContent";
import type { LearnerActivity } from "../../../shared/content/contracts/learnerActivities";
import type { ContentId } from "../../../shared/content/contracts/learnerContent";

const contentId = (value: number): ContentId => String(value) as ContentId;

export async function mapDraftLessonToLearnerLessonData(lesson: { id: number; unitId: number; title: string; description: string }, courseId: number, activities: Awaited<ReturnType<typeof listActivities>>) {
  const mapped = await Promise.all(activities.map(async (activity): Promise<LearnerActivity> => {
  const base = { id: contentId(activity.id), title: activity.title, position: activity.position, required: activity.required };
  switch (activity.type) {
    case "theory": return { ...base, type: "theory", blocks: await Promise.all((await listTheoryBlocks(activity.id)).map(mapDraftTheoryBlock)) };
    case "listening": return { ...base, type: "listening", items: await Promise.all((await listListeningItems(activity.id)).map(async (item) => ({ id: contentId(item.id), title: item.title, instructions: item.instructions, transcript: item.transcript, audio: item.audioAssetId ? await draftAudio(item.audioAssetId) : null, questions: [] }))) };
    case "pronunciation": return { ...base, type: "pronunciation", items: await Promise.all((await listPronunciationItems(activity.id)).map(async (item) => ({ id: contentId(item.id), title: item.title, instructions: item.instructions, displayText: item.displayText, blockType: item.blockType ?? undefined, spellingPattern: item.spellingPattern, entries: item.entries, audio: item.audioAssetId ? await draftAudio(item.audioAssetId) : null }))) };
    case "practice": return { ...base, type: "practice", delivery: "metadata-only", items: [] };
    case "quiz": { const assessment = await getAssessment(activity.id); const questions = assessment ? await listQuestions(assessment.id) : []; return { ...base, type: "quiz", scoring: "deferred", assessments: assessment ? [{ id: contentId(assessment.id), title: assessment.title, questions: questions.map((question) => ({ id: contentId(question.id), prompt: question.prompt, position: question.position, required: question.required, options: question.options.map((option) => ({ id: contentId(option.id), text: option.text, position: option.position })) })) }] : [] }; }
    case "ai_speaking_mission": { const mission = await getAiMission(activity.id); return { ...base, type: "ai_speaking_mission", missionId: contentId(mission.activity_id), config: structuredClone(mission.config) } as LearnerActivity; }
    case "interactive_practice": return { ...base, type: "practice", delivery: "metadata-only", items: [] };
  }
  }));
  return { id: contentId(lesson.id), unitId: contentId(lesson.unitId), courseId: contentId(courseId), title: lesson.title, description: lesson.description, metadata: { source: "local" as const, lessonId: contentId(lesson.id), fixtureRevision: "1" as const }, activities: mapped };
}

async function mapDraftTheoryBlock(block: Awaited<ReturnType<typeof listTheoryBlocks>>[number]): Promise<import("../../../shared/content/contracts/learnerActivities").LearnerTheoryBlock> {
  switch (block.blockType) {
    case "heading": return { type: "heading", level: (block.headingLevel ?? 2) as 1 | 2 | 3, text: block.text ?? block.title ?? "" };
    case "paragraph": return { type: "paragraph", text: block.text ?? "" };
    case "tip": return { type: "tip", text: block.text ?? "" };
    case "example": return { type: "example", title: block.title ?? "Example", text: block.text ?? "" };
    case "image":
    case "audio": {
      if (!block.mediaAssetId) throw new Error(`Saved ${block.blockType} media is missing.`);
      let asset: Awaited<ReturnType<typeof getLearnMediaAsset>> | null = null;
      try { asset = await getLearnMediaAsset(block.mediaAssetId, block.blockType); } catch { /* Preserve the stable reference and render a local media fallback. */ }
      const media = { id: block.mediaAssetId as ContentId, kind: block.blockType, url: asset?.previewUrl ?? "", mimeType: asset?.mimeType ?? null, altText: block.altText } as const;
      return block.blockType === "image"
        ? { type: "image", media, alt: block.altText ?? "" }
        : { type: "audio", media, label: block.title ?? "", transcript: block.text ?? "" };
    }
  }
}

async function draftAudio(assetId: string) {
  try {
    const asset = await getListeningAudioAsset(assetId);
    return { id: asset.id as ContentId, kind: "audio" as const, url: asset.previewUrl, mimeType: "audio/mpeg", altText: asset.filename };
  } catch {
    return null;
  }
}

export async function getDraftLesson(id: ContentId): Promise<LearnerLesson | null> {
  const lessonId = Number(id);
  if (!Number.isSafeInteger(lessonId)) return null;
  try {
    const parent = await getAdminUnitForLesson(lessonId);
    const lesson = await getAdminLesson(lessonId, parent.unitId);
    const version = await loadLessonVersion(lesson.id);
    if (!version || version.status !== "draft") return null;
    const activities = await listActivities(version.id);
    return mapDraftLessonToLearnerLessonData(lesson, parent.courseId, activities);
  } catch { return null; }
}

async function getAdminUnitForLesson(lessonId: number): Promise<{ unitId: number; courseId: number }> {
  // Lesson Studio already enforces parent scoping. This lookup is only a safe
  // best-effort adapter; failure lets the resolver continue to published/local.
  const { supabase } = await import("../../../shared/lib/supabaseClient");
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.from("lessons").select("unit_id,units(course_id)").eq("id", lessonId).maybeSingle();
  if (error || !data) throw error ?? new Error("Lesson not found.");
  const row = data as unknown as { unit_id: number; units: { course_id: number } | null };
  if (!row.units) throw new Error("Lesson parent not found.");
  return { unitId: Number(row.unit_id), courseId: Number(row.units.course_id) };
}

export async function getDraftCourse(id: ContentId): Promise<LearnerCourse | null> {
  const courseId = Number(id);
  if (!Number.isSafeInteger(courseId)) return null;
  try {
    const course = await getAdminCourse(courseId);
    const units = await listAdminUnits(course.id);
    const mappedUnits: LearnerUnit[] = await Promise.all(units.map(async (unit) => {
      const lessons = await listAdminLessons(unit.id);
      return {
        id: contentId(unit.id), courseId: contentId(course.id), title: unit.title, description: unit.description, position: unit.position, lessonCount: lessons.length,
        lessons: lessons.map((lesson) => ({ id: contentId(lesson.id), unitId: contentId(unit.id), title: lesson.title, description: lesson.description, position: lesson.position, currentVersionId: null, activityCount: 0, available: true })),
      };
    }));
    return { id: contentId(course.id), slug: course.slug, title: course.title, description: course.description, level: course.level, emoji: course.emoji, position: course.position, unitCount: mappedUnits.length, visibility:"class_only", units: mappedUnits };
  } catch { return null; }
}
