import { Link, useSearchParams } from "react-router-dom";
import { previewExitPath } from "./previewNavigation";

export function StudentPreviewToolbar({ returnPath, draft = false, source = draft ? "draft" : "published" }: { returnPath: string; draft?: boolean; source?: "draft" | "published" | "local" }) {
  const [searchParams] = useSearchParams();
  const exitPath = previewExitPath(searchParams.get("returnTo"), searchParams.get("activity"), returnPath);
  const label = source === "draft" ? "Draft Preview" : source === "local" ? "Local Content Preview" : "Published Preview";
  const detail = source === "local" ? "This preview uses local learner content because no saved remote version is available." : "You are viewing this content as a student. Preview responses are not saved.";
  return <div className="sticky top-0 z-40 border-b border-blue-200 bg-blue-50 px-4 py-3 text-blue-950 shadow-sm"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3"><div><span className="mr-2 inline-flex rounded-full bg-blue-700 px-2.5 py-1 text-xs font-bold text-white">Student Preview</span><span className="text-sm font-semibold">{label}</span><span className="ml-2 text-xs text-blue-800">{detail}</span></div><Link to={exitPath} className="admin-focus inline-flex min-h-9 items-center rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-sm font-semibold text-blue-800">Exit Preview</Link></div></div>;
}
