import { ButtonLink, EmptyState } from "../ui";
import { getEmptyClassesContent } from "./classEmptyState";

export function EmptyClassesState({ canCreate }: { canCreate: boolean }) {
  const content = getEmptyClassesContent(canCreate);
  return <EmptyState title="No classes yet" description={content.description} action={content.showSetupAction ? <ButtonLink to="/admin/classes/new">Review class setup</ButtonLink> : undefined} />;
}
