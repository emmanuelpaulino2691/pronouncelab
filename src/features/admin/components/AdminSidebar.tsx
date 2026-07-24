import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { supabase } from "../../../shared/lib/supabaseClient";
import { useAdminPermissions } from "../permissions/useAdminPermissions";
import { AdminIcon, Avatar, Badge, Button } from "../ui";
import { futureWorkspaceSections, getWorkspaceRole } from "../workspace";

const navigationItems = [
  { label: "Dashboard", to: "/admin", icon: "dashboard" as const, end: true },
  { label: "Courses", to: "/admin/courses", icon: "courses" as const, end: false },
];

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

function AdminSidebar({ isOpen, onClose }: Props) {
  const navigate = useNavigate();
  const {
    canEditDrafts,
    canPublish,
    isAdmin,
  } = useAdminPermissions();
  const workspaceRole = getWorkspaceRole({ canEditDrafts, canPublish, isAdmin });
  const [email, setEmail] = useState("Content manager");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const roleLabel = isAdmin
    ? "Administrator"
    : canEditDrafts && canPublish
      ? "Teacher"
      : canEditDrafts
        ? "Editor"
        : canPublish
          ? "Publisher"
          : "Content manager";

  useEffect(() => {
    let active = true;
    void supabase?.auth.getUser().then(({ data }) => {
      if (active && data.user?.email) setEmail(data.user.email);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen, onClose]);

  async function handleSignOut() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    setSignOutError(null);
    try {
      if (!supabase) throw new Error("Authentication is not configured.");
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      onClose();
      navigate("/login", { replace: true });
    } catch {
      setSignOutError("Sign out failed. Please try again.");
      setIsSigningOut(false);
    }
  }

  return (
    <>
      {isOpen && <button type="button" aria-label="Close navigation" onClick={onClose} className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-[2px] lg:hidden" />}
      <aside
        aria-label="Content Studio navigation"
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(86vw,18rem)] flex-col bg-slate-950 text-white shadow-2xl transition-transform duration-200 motion-reduce:transition-none lg:sticky lg:top-0 lg:z-20 lg:h-screen lg:w-72 lg:translate-x-0 lg:shadow-none ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-start justify-between border-b border-slate-800 px-6 py-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 font-black shadow-lg shadow-blue-950/30">P</span>
              <div><p className="text-lg font-bold tracking-tight">PronounceLab</p><p className="text-[11px] text-slate-400">with Emmanuel Paulino</p></div>
            </div>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-blue-400">{workspaceRole === "administrator" ? "Platform Admin" : "Teacher Workspace"}</p>
          </div>
          <button autoFocus={isOpen} type="button" aria-label="Close menu" onClick={onClose} className="admin-focus min-h-11 min-w-11 rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden">
            <AdminIcon name="close" className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-5">
          <ul className="space-y-1.5">
            {navigationItems.map((item) => <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) => `admin-focus flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-950/25" : "text-slate-300 hover:bg-slate-900 hover:text-white"}`}
              >
                <AdminIcon name={item.icon} className="h-5 w-5" />{item.to === "/admin" && workspaceRole !== "administrator" ? "Overview" : item.to === "/admin/courses" && workspaceRole !== "administrator" ? "My Courses" : item.label}
              </NavLink>
            </li>)}
            <li className="pt-4"><p className="px-4 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Workspace</p></li>
            {futureWorkspaceSections.map((label) => <li key={label}>
              <div aria-disabled="true" className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-500">
                <span className="flex items-center gap-3"><AdminIcon name="book" className="h-5 w-5" />{label}</span><span className="text-[10px] font-bold uppercase tracking-wide text-slate-600">Later</span>
              </div>
            </li>)}
          </ul>
        </nav>

        <div className="border-t border-slate-800 p-4">
          <div className="mb-3 flex min-w-0 items-center gap-3 rounded-xl bg-slate-900 p-3">
            <Avatar label={email} />
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-white" title={email}>{email}</p><div className="mt-1"><Badge tone="info">{roleLabel}</Badge></div></div>
          </div>
          {signOutError && <p role="alert" className="mb-3 rounded-lg bg-red-950 px-3 py-2 text-xs text-red-200">{signOutError}</p>}
          <Button variant="ghost" icon="sign-out" isLoading={isSigningOut} onClick={() => void handleSignOut()} className="w-full justify-start text-slate-300 hover:bg-slate-900 hover:text-white">
            {isSigningOut ? "Signing out…" : "Sign out"}
          </Button>
        </div>
      </aside>
    </>
  );
}

export default AdminSidebar;
