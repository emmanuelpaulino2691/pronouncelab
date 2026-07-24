import type { ClassStatus, ClassSummary } from "./classTypes";

export function filterClassSummaries(classes: readonly ClassSummary[], query: string, status: "all" | ClassStatus): ClassSummary[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return classes.filter((item) => (status === "all" || item.status === status)
    && (!normalizedQuery || `${item.name} ${item.term ?? ""} ${item.owner ?? ""}`.toLocaleLowerCase().includes(normalizedQuery)));
}
