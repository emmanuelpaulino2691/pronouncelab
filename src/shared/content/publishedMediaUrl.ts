import { supabase } from "../lib/supabaseClient";

const publicBuckets = new Set(["content-audio", "content-images"]);

export function resolvePublishedMediaUrl(publicPath: string): string {
  const separator = publicPath.indexOf("/");
  if (!supabase || separator <= 0) return publicPath;
  const bucket = publicPath.slice(0, separator);
  const objectPath = publicPath.slice(separator + 1);
  if (!publicBuckets.has(bucket) || !objectPath) return publicPath;
  return supabase.storage.from(bucket).getPublicUrl(objectPath).data.publicUrl;
}
