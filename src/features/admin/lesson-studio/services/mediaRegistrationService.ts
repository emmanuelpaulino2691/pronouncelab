import { supabase } from "../../../../shared/lib/supabaseClient";

export type RegisteredMedia = { id: string; status: "draft" | "published"; reused: boolean };

export async function registerUploadedMedia(input: {
  kind: "audio" | "image";
  bucket: string;
  objectPath: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<RegisteredMedia> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.functions.invoke("register-media", { body: input });
  if (error || !data || typeof data.id !== "string" || (data.status !== "draft" && data.status !== "published")) {
    throw new Error("The upload could not be registered in the Media Library.");
  }
  return { id: data.id, status: data.status, reused: data.reused === true };
}
