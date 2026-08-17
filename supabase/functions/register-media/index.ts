import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Body = { kind?: unknown; bucket?: unknown; objectPath?: unknown; filename?: unknown; mimeType?: unknown; sizeBytes?: unknown };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8" } });

async function sha256(blob: Blob) {
  const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ message: "Method not allowed." }, 405);
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authorization = request.headers.get("authorization");
  if (!url || !anonKey || !serviceKey || !authorization) return json({ message: "Media registration is unavailable." }, 503);
  let body: Body;
  try { body = await request.json(); } catch { return json({ message: "Invalid media registration request." }, 400); }
  const kind = body.kind === "audio" || body.kind === "image" ? body.kind : null;
  const expectedBucket = kind === "audio" ? "content-audio-drafts" : kind === "image" ? "content-image-drafts" : null;
  if (!kind || body.bucket !== expectedBucket || typeof body.objectPath !== "string" || typeof body.filename !== "string" || typeof body.mimeType !== "string" || typeof body.sizeBytes !== "number") {
    return json({ message: "Invalid media registration request." }, 400);
  }
  const caller = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } });
  const service = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userData, error: userError } = await caller.auth.getUser();
  const user = userData.user;
  if (userError || !user) return json({ message: "Sign in again before uploading media." }, 401);
  if (!body.objectPath.startsWith(`${user.id}/`)) return json({ message: "The uploaded media does not belong to this account." }, 403);

  const { data: bytes, error: downloadError } = await service.storage.from(expectedBucket).download(body.objectPath);
  if (downloadError || !bytes || bytes.size !== body.sizeBytes) return json({ message: "The uploaded media could not be verified." }, 400);
  const hash = await sha256(bytes);
  const { data, error } = await service.rpc("register_uploaded_media", {
    requested_uploaded_by: user.id, requested_kind: kind, requested_bucket: expectedBucket,
    requested_object_path: body.objectPath, requested_original_filename: body.filename,
    requested_mime_type: body.mimeType, requested_size_bytes: body.sizeBytes,
    trusted_content_sha256: hash,
  });
  const result = data?.[0];
  if (error || !result) {
    await service.storage.from(expectedBucket).remove([body.objectPath]);
    console.error("register-media failure", { code: error?.code, message: error?.message, details: error?.details });
    return json({ message: "The upload could not be registered in the Media Library." }, 409);
  }
  if (result.duplicate_upload) {
    const cleanup = await service.storage.from(expectedBucket).remove([body.objectPath]);
    if (cleanup.error) {
      console.error("register-media duplicate cleanup failure", { mediaAssetId: result.media_asset_id, bucket: expectedBucket, objectPath: body.objectPath, message: cleanup.error.message });
      return json({ message: "The duplicate upload was found but temporary Storage cleanup failed." }, 500);
    }
  }
  return json({ id: result.media_asset_id, status: result.media_status, reused: result.duplicate_upload });
});
