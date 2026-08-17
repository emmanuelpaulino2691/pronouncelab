import { supabase } from "../lib/supabaseClient";
import { emptyServerProgress, parseServerLearnerProgress, type ServerLearnerProgress } from "./learnerProgressSync";

type RpcClient = { rpc(name: string, args?: Record<string, unknown>): Promise<{ data: unknown; error: { message: string } | null }> };
const client = () => supabase as unknown as RpcClient | null;

async function permitsLearnerProgress(current: RpcClient) {
  const { data, error } = await current.rpc("is_learner_identity");
  return !error && data === true;
}

export function createLearnerProgressService(current: RpcClient | null) {
  return {
    async load(): Promise<ServerLearnerProgress | null> {
      if (!current || !(await permitsLearnerProgress(current))) return null;
      const { data, error } = await current.rpc("get_my_learner_progress");
      if (error) return null;
      return parseServerLearnerProgress(data ?? emptyServerProgress());
    },
    async visit(lessonId: string, activityId?: string): Promise<boolean> {
      if (!current || !(await permitsLearnerProgress(current))) return false;
      const { error } = await current.rpc("record_learner_lesson_visit", { requested_lesson_id: lessonId, requested_activity_id: activityId ?? null });
      return !error;
    },
    async completeActivity(activityId: string): Promise<boolean> {
      if (!current || !(await permitsLearnerProgress(current))) return false;
      const { error } = await current.rpc("record_learner_activity_completion", { requested_activity_id: activityId });
      return !error;
    },
  };
}

export async function loadServerLearnerProgress(): Promise<ServerLearnerProgress | null> {
  return createLearnerProgressService(client()).load();
}

export async function recordServerLessonVisit(lessonId: string, activityId?: string): Promise<boolean> {
  return createLearnerProgressService(client()).visit(lessonId, activityId);
}

export async function recordServerActivityCompletion(activityId: string): Promise<boolean> {
  return createLearnerProgressService(client()).completeActivity(activityId);
}
