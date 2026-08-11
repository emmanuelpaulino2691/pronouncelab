import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Scope = "lesson" | "course";
type RequestBody = { scope?: unknown; id?: unknown };
type MediaPlanRow = {
  media_asset_id: string;
  activity_type: string;
  item_id: number;
  reference_kind: string;
  media_status: "draft" | "published" | "unpublished" | "archived";
};
type Preparation = {
  media_asset_id: string;
  source_bucket: string;
  destination_bucket: string;
  object_path: string;
  publication_token: string;
  source_storage_object_id: string;
  source_storage_object_version: string;
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=utf-8" },
});

function safeMessage(message: string | undefined) {
  if (!message) return "The publication service could not complete the request.";
  const known = [
    "Only a draft lesson version can be published",
    "Course publication permission is required",
    "Listening activities require audio before publication",
    "Pronunciation content is incomplete",
    "Media references are not ready for publication",
  ];
  return known.find((value) => message.includes(value)) ??
    "The publication service could not complete the request.";
}

async function sha256(blob: Blob) {
  const bytes = await blob.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ message: "Method not allowed." }, 405);
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authorization = request.headers.get("authorization");
  if (!url || !anonKey || !serviceKey || !authorization) {
    return json({ message: "The publication service is unavailable." }, 503);
  }

  let body: RequestBody;
  try { body = await request.json(); }
  catch { return json({ message: "Invalid publication request." }, 400); }
  const scope: Scope | null = body.scope === "lesson" || body.scope === "course" ? body.scope : null;
  const id = typeof body.id === "number" && Number.isSafeInteger(body.id) && body.id > 0 ? body.id : null;
  if (!scope || id === null) return json({ message: "Invalid publication request." }, 400);

  const caller = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } });
  const service = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const planFunction = scope === "lesson"
    ? "get_lesson_version_media_publication_plan"
    : "get_course_media_publication_plan";
  const planArgument = scope === "lesson"
    ? { requested_lesson_version_id: id }
    : { requested_course_id: id };
  const { data: planData, error: planError } = await caller.rpc(planFunction, planArgument);
  if (planError) return json({ message: safeMessage(planError.message) }, 400);

  const rows = (planData ?? []) as MediaPlanRow[];
  const assets = [...new Map(rows.map((row) => [row.media_asset_id, row])).values()];
  for (const asset of assets) {
    if (asset.media_status === "published") continue;
    if (asset.media_status !== "draft") {
      return json({
        message: `${asset.reference_kind} in ${asset.activity_type} item ${asset.item_id} is not ready. Replace or re-upload the media, then publish again.`,
      }, 400);
    }

    const { data: preparedData, error: prepareError } = await caller.rpc(
      "prepare_media_publication",
      { requested_media_asset_id: asset.media_asset_id },
    );
    if (prepareError || !preparedData?.[0]) {
      return json({
        message: `${asset.reference_kind} in ${asset.activity_type} item ${asset.item_id} could not be prepared. Re-upload the media and try again.`,
      }, 400);
    }
    const prepared = preparedData[0] as Preparation;
    const { data: source, error: downloadError } = await service.storage
      .from(prepared.source_bucket).download(prepared.object_path);
    if (downloadError || !source) {
      return json({ message: `${asset.reference_kind} in ${asset.activity_type} item ${asset.item_id} is missing from Storage. Re-upload it and try again.` }, 400);
    }
    const hash = await sha256(source);
    // Upload with the caller's JWT so Storage records the prepared publisher
    // as owner_id; finalization deliberately rejects service-owned copies.
    const { error: uploadError } = await caller.storage
      .from(prepared.destination_bucket)
      .upload(prepared.object_path, source, {
        upsert: false,
        contentType: source.type || undefined,
        metadata: {
          publication_token: prepared.publication_token,
          source_storage_object_id: prepared.source_storage_object_id,
          source_storage_object_version: prepared.source_storage_object_version,
        },
      });
    if (uploadError) {
      return json({ message: `${asset.reference_kind} in ${asset.activity_type} item ${asset.item_id} could not be copied for learner delivery. Try again.` }, 409);
    }
    const { error: finalizeError } = await service.rpc("finalize_media_publication", {
      requested_media_asset_id: prepared.media_asset_id,
      requested_publication_token: prepared.publication_token,
      trusted_source_sha256: hash,
      trusted_destination_sha256: hash,
    });
    if (finalizeError) {
      await caller.storage.from(prepared.destination_bucket).remove([prepared.object_path]);
      return json({ message: `${asset.reference_kind} in ${asset.activity_type} item ${asset.item_id} could not be verified for learner delivery. Try again.` }, 409);
    }
  }

  const publishFunction = scope === "lesson" ? "publish_lesson_version" : "publish_course";
  const publishArgument = scope === "lesson"
    ? { requested_lesson_version_id: id }
    : { requested_course_id: id };
  const { data, error } = await caller.rpc(publishFunction, publishArgument);
  if (error) return json({ message: safeMessage(error.message) }, 400);
  return json(data);
});
