const COURSE_PATH_PREFIX = "/courses/";

export function normalizeSlug(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function generateSlugFromTitle(title: string): string {
  return normalizeSlug(title);
}

export function buildCourseUrlPreview(slug: string): string {
  return `${COURSE_PATH_PREFIX}${normalizeSlug(slug)}`;
}
