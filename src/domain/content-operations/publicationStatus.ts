export type PublicationIndicator = {
  label: "Published" | "Draft" | "Draft changes" | "Archived" | "Unavailable";
  explanation: string;
  tone: "success" | "draft" | "warning" | "neutral";
};

export function getPublicationIndicator(input: {
  status?: string | null;
  currentPublishedVersionId?: number | null;
}): PublicationIndicator {
  if (input.status === "archived") return { label: "Archived", explanation: "Historical version.", tone: "neutral" };
  if (input.status === "published") return { label: "Published", explanation: "Latest published version.", tone: "success" };
  if (input.status === "draft" && input.currentPublishedVersionId != null) return { label: "Draft changes", explanation: "A published version exists, with unpublished edits.", tone: "warning" };
  if (input.status === "draft") return { label: "Draft", explanation: "Never published.", tone: "draft" };
  return { label: "Unavailable", explanation: "Publication status is not available.", tone: "neutral" };
}
