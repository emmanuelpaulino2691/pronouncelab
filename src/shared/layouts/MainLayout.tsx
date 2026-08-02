import { useId, useState, type ReactNode } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import StudentNavigationDrawer from "../components/StudentNavigationDrawer";
import { studentContentPaddingClass, studentSidebarClass, type StudentLayoutMode } from "./studentLayoutMode";

type MainLayoutProps = { children: ReactNode; immersive?: boolean; layoutMode?: StudentLayoutMode };

export default function MainLayout({ children, immersive = false, layoutMode = "auto" }: MainLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerId = useId();
  if (immersive) return <main className="min-h-screen overflow-x-hidden bg-slate-50">{children}</main>;

  return (
    <div className="flex min-h-screen min-w-0 overflow-x-hidden bg-slate-100" data-student-shell-mode={layoutMode}>
      <Sidebar className={studentSidebarClass(layoutMode)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header layoutMode={layoutMode} drawerOpen={drawerOpen} drawerId={drawerId} onOpenDrawer={() => setDrawerOpen(true)} />
        <main className={`min-w-0 flex-1 ${studentContentPaddingClass(layoutMode)}`}>{children}</main>
      </div>
      <StudentNavigationDrawer open={drawerOpen} id={drawerId} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
