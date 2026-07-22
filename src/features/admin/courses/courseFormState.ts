import type { CourseInput } from "./adminCourseService";
import { generateSlugFromTitle } from "./courseFormUtils";

export type CourseSlugState = {
  slug: string;
  syncWithTitle: boolean;
};

export function createCourseSlugState(
  slug: string,
  isExistingCourse: boolean
): CourseSlugState {
  return {
    slug,
    syncWithTitle: !isExistingCourse,
  };
}

export function updateSlugForTitle(
  state: CourseSlugState,
  title: string
): CourseSlugState {
  return state.syncWithTitle
    ? { ...state, slug: generateSlugFromTitle(title) }
    : state;
}

export function setManualSlug(slug: string): CourseSlugState {
  return { slug, syncWithTitle: false };
}

export function resetSlugToTitle(title: string): CourseSlugState {
  return {
    slug: generateSlugFromTitle(title),
    syncWithTitle: true,
  };
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
