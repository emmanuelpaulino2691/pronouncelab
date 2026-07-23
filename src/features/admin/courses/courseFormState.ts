import type { CourseInput } from "./adminCourseService";
import { generateSlugFromTitle } from "./courseFormUtils";

const courseSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type CourseSlugState = {
  slug: string;
  ownership: "automatic" | "manual";
};

export function createCourseSlugState(
  slug: string,
  isExistingCourse: boolean
): CourseSlugState {
  return {
    slug,
    ownership: isExistingCourse ? "manual" : "automatic",
  };
}

export function updateSlugForTitle(
  state: CourseSlugState,
  title: string
): CourseSlugState {
  return state.ownership === "automatic"
    ? { ...state, slug: generateSlugFromTitle(title) }
    : state;
}

export function enableManualSlugEditing(
  state: CourseSlugState
): CourseSlugState {
  return { ...state, ownership: "manual" };
}

export function setManualSlug(slug: string): CourseSlugState {
  return { slug, ownership: "manual" };
}

export function resetSlugToTitle(title: string): CourseSlugState {
  return {
    slug: generateSlugFromTitle(title),
    ownership: "automatic",
  };
}

export function getCourseSlugError(slug: string): string {
  if (!slug.trim()) return "Add a course address.";
  return courseSlugPattern.test(slug.trim())
    ? ""
    : "Use lowercase letters, numbers, and single hyphens only.";
}

export function canSubmitCourseForm(
  isSaving: boolean,
  titleError: string,
  slugError: string
): boolean {
  return !isSaving && !titleError && !slugError;
}

export function buildCourseSubmissionInput(
  input: CourseInput
): CourseInput {
  return {
    ...input,
    slug: input.slug.trim(),
    title: input.title.trim(),
    description: input.description.trim(),
    level: input.level.trim(),
    emoji: input.emoji.trim(),
  };
}

export function shouldRenderCourseForm(
  isOpen: boolean,
  isLoadingCourses: boolean
): boolean {
  return isOpen && !isLoadingCourses;
}

export function areCourseInputsEqual(
  first: CourseInput,
  second: CourseInput
): boolean {
  return (
    first.slug === second.slug &&
    first.title === second.title &&
    first.description === second.description &&
    first.level === second.level &&
    first.emoji === second.emoji &&
    first.position === second.position
  );
}
