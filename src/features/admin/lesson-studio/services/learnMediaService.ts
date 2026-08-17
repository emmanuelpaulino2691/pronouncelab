import { supabase } from "../../../../shared/lib/supabaseClient";
import { uploadListeningAudio } from "./listeningMediaService";
import { registerUploadedMedia } from "./mediaRegistrationService";

export type LearnMediaAssetRow = {
  id: string;
  kind: "image" | "audio";
  original_filename: string;
  bucket: string;
  object_path: string;
  mime_type: string | null;
};

export async function resolveLearnMediaAssetRow(
  row: LearnMediaAssetRow,
  resolveUrl: (bucket: string, objectPath: string) => Promise<string>,
) {
  return {
    id: row.id,
    filename: row.original_filename,
    mimeType: row.mime_type,
    previewUrl: await resolveUrl(row.bucket, row.object_path),
  };
}

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
  let registered;
  try {
    registered = await registerUploadedMedia({ kind: "image", bucket, objectPath: path, filename: file.name, mimeType: file.type, sizeBytes: file.size });
  } catch {
    await supabase.storage.from(bucket).remove([path]);
    throw new Error("The image uploaded but could not be saved to the media library.");
  }
  const asset = await getLearnMediaAsset(registered.id, "image");
  return { id: asset.id, previewUrl: asset.previewUrl, filename: asset.filename };
}

async function getLearnMediaAssetRow(assetId: string, kind: "image" | "audio") {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.from("media_assets").select("id,kind,original_filename,bucket,object_path,mime_type").eq("id", assetId).eq("kind", kind).maybeSingle();
  if (error || !data) throw new Error(`The saved ${kind} preview could not be loaded.`);
  return data as LearnMediaAssetRow;
}

export async function getLearnMediaAsset(assetId: string, kind: "image" | "audio") {
  const row = await getLearnMediaAssetRow(assetId, kind);
  return resolveLearnMediaAssetRow(row, async (bucket, objectPath) => {
    if (!supabase) throw new Error("Supabase is not configured.");
    if (bucket === "content-audio" || bucket === "content-images") {
      return supabase.storage.from(bucket).getPublicUrl(objectPath).data.publicUrl;
    }
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(objectPath, 3600);
    if (error) throw new Error(`The saved ${kind} preview could not be loaded.`);
    return data.signedUrl;
  });
}

export const getLearnImageAsset = (assetId: string) => getLearnMediaAsset(assetId, "image");
