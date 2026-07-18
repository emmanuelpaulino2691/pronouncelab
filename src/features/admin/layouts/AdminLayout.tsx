import { useCallback, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import AdminSidebar from "../components/AdminSidebar";
import { AdminIcon } from "../ui";

function getPageContext(pathname: string) {
  if (pathname.includes("/studio")) return "Lesson Studio";
  if (/\/units\/\d+/.test(pathname)) return "Lessons";
  if (/\/courses\/\d+/.test(pathname)) return "Course curriculum";
  if (pathname.startsWith("/admin/courses")) return "Courses";
  return "Dashboard";
}

function AdminLayout() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  return (
    <div className="min-h-screen bg-[var(--pl-page)] lg:flex">
      <AdminSidebar isOpen={isMenuOpen} onClose={closeMenu} />
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 px-4 py-3 backdrop-blur sm:px-7 lg:px-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button type="button" aria-label="Open navigation" onClick={() => setIsMenuOpen(true)} className="admin-focus rounded-xl border border-slate-200 p-2.5 text-slate-700 hover:bg-slate-50 lg:hidden">
                <AdminIcon name="menu" className="h-5 w-5" />
              </button>
              <div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900">{getPageContext(location.pathname)}</p><p className="hidden truncate text-xs text-slate-500 sm:block">Improve your English every day.</p></div>
            </div>
            <span className="hidden rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 md:inline-flex">PronounceLab Content Studio</span>
          </div>
        </header>
        <main className="px-4 py-7 sm:px-7 lg:px-10 lg:py-10"><Outlet /></main>
      </div>
    </div>
  );
}

export default AdminLayout;
