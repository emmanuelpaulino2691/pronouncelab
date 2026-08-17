import { getPublicationIndicator } from "../../../domain/content-operations";
import { Badge } from "../ui";

export function PublicationStatusBadge(props: { status?: string | null; currentPublishedVersionId?: number | null }) {
  const indicator = getPublicationIndicator(props);
  return <span title={indicator.explanation} aria-label={`${indicator.label}. ${indicator.explanation}`}><Badge tone={indicator.tone}>{indicator.label}</Badge></span>;
}
