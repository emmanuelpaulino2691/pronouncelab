import type { ReactNode } from "react";
import MainLayout from "../../../shared/layouts/MainLayout";
import { StudentPreviewToolbar } from "./StudentPreviewToolbar";
import type { PreviewViewportMode } from "./previewViewport";

export default function StudentPreviewShell({ children, returnPath, source, viewportMode, onViewportModeChange }: { children: ReactNode; returnPath: string; source: "draft" | "published"; viewportMode?: PreviewViewportMode; onViewportModeChange?: (mode: PreviewViewportMode) => void }) {
  return <><StudentPreviewToolbar returnPath={returnPath} source={source} viewportMode={viewportMode} onViewportModeChange={onViewportModeChange} /><MainLayout immersive>{children}</MainLayout></>;
}
