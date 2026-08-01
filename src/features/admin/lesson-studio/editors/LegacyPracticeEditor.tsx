import CollapsibleEditorSection from "../components/CollapsibleEditorSection";
import type { ActivitySectionCollapseController } from "../studioViewState";
import { useEditorSectionCollapse } from "../useEditorSectionCollapse";

export default function LegacyPracticeEditor({ activityId, onSectionControllerChange }: { activityId: number; onSectionControllerChange?: (controller: ActivitySectionCollapseController | null) => void }) {
  const sections = useEditorSectionCollapse(activityId, ["legacy-practice"], onSectionControllerChange);
  return <CollapsibleEditorSection sectionId="legacy-practice" title="Existing Practice activity" collapsed={sections.collapsed.has("legacy-practice")} onToggle={() => sections.toggle("legacy-practice")} summary="Compatibility content · learner scoring and behavior unchanged">
    <p className="text-sm leading-6 text-slate-600">This activity remains available for compatibility with existing lessons. You can update its title and required status above, while its existing lesson position and actions remain supported.</p>
  </CollapsibleEditorSection>;
}
