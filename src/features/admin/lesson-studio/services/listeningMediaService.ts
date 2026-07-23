import { supabase } from "../../../../shared/lib/supabaseClient";

import { getListeningAudioFileError } from "../listeningValidation";

const draftAudioBucket = "content-audio-drafts";

export type ListeningAudioAsset = {
  id: string;
  filename: string;
  previewUrl: string;
  status: "draft" | "published" | "unpublished" | "archived";
};

export class ListeningMediaError extends Error {
  readonly kind: "session" | "upload" | "registration" | "preview";

  constructor(kind: "session" | "upload" | "registration" | "preview") {
    super(kind);
    this.name = "ListeningMediaError";
    this.kind = kind;
  }
}

export function getListeningMediaErrorMessage(error: unknown): string {
  if (error instanceof ListeningMediaError) {
    switch (error.kind) {
      case "session":
        return "Sign in again before uploading audio.";
      case "registration":
        return "The MP3 uploaded, but it could not be added to the media library. Try again.";
      case "preview":
        return "The saved audio preview could not be loaded. Try again.";
      case "upload":
        return "The audio could not be uploaded. Choose the file and try again.";
    }
  }
  return "The audio could not be uploaded. Choose the file and try again.";
}

function client() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

function safeFilename(filename: string): string {
  const normalized = filename
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized || "listening.mp3";
}

async function previewUrl(bucket: string, objectPath: string) {
  if (bucket === "content-audio") {
    return client().storage.from(bucket).getPublicUrl(objectPath).data.publicUrl;
  }
  const { data, error } = await client().storage
    .from(bucket)
    .createSignedUrl(objectPath, 60 * 60);
  if (error) throw new ListeningMediaError("preview");
  return data.signedUrl;
}

export async function getListeningAudioAsset(assetId: string) {
  const { data, error } = await client()
    .from("media_assets")
    .select("id,original_filename,bucket,object_path,status")
    .eq("id", assetId)
    .eq("kind", "audio")
    .maybeSingle();
  if (error || !data) throw new ListeningMediaError("preview");
  const row = data as unknown as {
    id: string;
    original_filename: string;
    bucket: string;
    object_path: string;
    status: ListeningAudioAsset["status"];
  };
  return {
    id: row.id,
    filename: row.original_filename,
    previewUrl: await previewUrl(row.bucket, row.object_path),
    status: row.status,
  } satisfies ListeningAudioAsset;
}

export async function uploadListeningAudio(
  activityId: number,
  file: File,
  context: "listening" | "pronunciation" = "listening"
) {
  const validationError = getListeningAudioFileError(file);
  if (validationError) throw new Error(validationError);

  const storageClient = client();
  const { data: authData, error: authError } = await storageClient.auth.getUser();
  if (authError || !authData.user) throw new ListeningMediaError("session");

  const objectPath = `${authData.user.id}/${context}-${activityId}/${crypto.randomUUID()}-${safeFilename(file.name)}`;
  const { error: uploadError } = await storageClient.storage
    .from(draftAudioBucket)
    .upload(objectPath, file, {
      cacheControl: "3600",
      contentType: "audio/mpeg",
      upsert: false,
    });
  if (uploadError) throw new ListeningMediaError("upload");

  const { data, error } = await storageClient
    .from("media_assets")
    .insert({
      kind: "audio",
      bucket: draftAudioBucket,
      object_path: objectPath,
      original_filename: file.name,
      mime_type: "audio/mpeg",
      size_bytes: file.size,
      status: "draft",
      uploaded_by: authData.user.id,
    })
    .select("id")
    .single();

  if (error) {
    await storageClient.storage.from(draftAudioBucket).remove([objectPath]);
    throw new ListeningMediaError("registration");
  }

  return getListeningAudioAsset((data as { id: string }).id);
}
