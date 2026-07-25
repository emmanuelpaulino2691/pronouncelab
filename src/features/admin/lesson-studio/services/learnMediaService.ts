import { supabase } from "../../../../shared/lib/supabaseClient";
import { getListeningAudioAsset, uploadListeningAudio } from "./listeningMediaService";

export async function uploadDraftLearnAudio(activityId: number, file: File) {
  return uploadListeningAudio(activityId, file, "pronunciation");
}

export async function uploadDraftLearnImage(activityId: number, file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Image format is not supported.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Image is too large. Choose a file under 10 MB.");
  if (!supabase) throw new Error("Sign in again before uploading an image.");
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Sign in again before uploading an image.");
  const safe = file.name.normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/[^a-zA-Z0-9._-]+/g, "-");
  const path = `${auth.user.id}/learn-${activityId}/${crypto.randomUUID()}-${safe || "image"}`;
  const bucket = "content-image-drafts";
  const uploaded = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false });
  if (uploaded.error) throw new Error("Image upload failed. Try another file.");
  const registered = await supabase.from("media_assets").insert({ kind: "image", bucket, object_path: path, original_filename: file.name, mime_type: file.type, size_bytes: file.size, status: "draft", uploaded_by: auth.user.id }).select("id").single();
  if (registered.error) throw new Error("The image uploaded but could not be saved to the media library.");
  const signed = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  if (signed.error) throw new Error("Image uploaded, but its preview could not be loaded.");
  return { id: String((registered.data as { id: string }).id), previewUrl: signed.data.signedUrl, filename: file.name };
}

export { getListeningAudioAsset };

export async function getLearnImageAsset(assetId: string) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.from("media_assets").select("id,original_filename,bucket,object_path,mime_type").eq("id", assetId).eq("kind", "image").maybeSingle();
  if (error || !data) throw new Error("The saved image preview could not be loaded.");
  const row = data as { id: string; original_filename: string; bucket: string; object_path: string; mime_type: string | null };
  const signed = await supabase.storage.from(row.bucket).createSignedUrl(row.object_path, 3600);
  if (signed.error) throw new Error("The saved image preview could not be loaded.");
  return { id: row.id, filename: row.original_filename, mimeType: row.mime_type, previewUrl: signed.data.signedUrl };
}
