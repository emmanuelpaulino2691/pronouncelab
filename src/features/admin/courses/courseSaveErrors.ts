type StructuredError = {
  code?: unknown;
  message?: unknown;
  details?: unknown;
};

function getStructuredError(error: unknown) {
  if (error instanceof Error) {
    return { code: "", text: error.message.toLowerCase() };
  }
  if (typeof error === "object" && error !== null) {
    const value = error as StructuredError;
    return {
      code: typeof value.code === "string" ? value.code : "",
      text: [value.message, value.details]
        .filter((part): part is string => typeof part === "string")
        .join(" ")
        .toLowerCase(),
    };
  }
  return { code: "", text: "" };
}

export function getCourseSaveErrorMessage(error: unknown) {
  const { code, text } = getStructuredError(error);
  if (code === "23505" && (text.includes("courses_slug_key") || text.includes("slug"))) {
    return "That course address is already in use. Choose a different address.";
  }
  if (code === "23505" && (text.includes("courses_position_unique") || text.includes("position"))) {
    return "The course order changed while this form was open. Close it, create the course again, and try once more.";
  }
  if (text.includes("jwt") || text.includes("session") || text.includes("sign in")) {
    return "Your session has expired. Sign in again before saving.";
  }
  if (code === "42501" || text.includes("permission") || text.includes("policy") || text.includes("row-level")) {
    return "You do not have permission to save this course.";
  }
  if (text.includes("failed to fetch") || text.includes("network")) {
    return "The course could not be saved because the network connection was interrupted. Try again.";
  }
  if (text.includes("draft") || text.includes("editable") || text.includes("sealed")) {
    return "This course is no longer editable. Close the form and refresh the course list.";
  }
  return "Your course changes could not be saved. Review the fields and try again.";
}
