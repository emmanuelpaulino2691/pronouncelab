import {
  NavLink,
  useNavigate,
} from "react-router-dom";
import { useState } from "react";

import { supabase } from "../../../shared/lib/supabaseClient";

const navigationItems = [
  {
    label: "Courses",
    to: "/admin/courses",
  },
];

function AdminSidebar() {
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] =
    useState(false);
  const [signOutError, setSignOutError] =
    useState<string | null>(null);

  async function handleSignOut() {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    setSignOutError(null);

    try {
      if (!supabase) {
        throw new Error(
          "Authentication is not configured."
        );
      }

      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      navigate("/login", { replace: true });
    } catch {
      setSignOutError(
        "Sign out failed. Please try again."
      );
      setIsSigningOut(false);
    }
  }

  return (
    <aside className="border-b border-slate-800 bg-slate-950 text-white lg:min-h-screen lg:w-72 lg:border-r lg:border-b-0">
      <div className="flex items-center justify-between px-5 py-5 lg:block lg:px-7 lg:py-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-400">
            PronounceLab
          </p>
          <p className="mt-1 text-xl font-bold">
            Content Studio
          </p>
        </div>

        <button
          type="button"
          disabled={isSigningOut}
          onClick={() => void handleSignOut()}
          className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 disabled:cursor-not-allowed disabled:opacity-50 lg:hidden"
        >
          {isSigningOut ? "Signing out…" : "Sign out"}
        </button>
      </div>

      <nav
        aria-label="Admin navigation"
        className="px-4 pb-4 lg:px-5"
      >
        <ul className="flex gap-2 lg:block lg:space-y-2">
          {navigationItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  [
                    "block rounded-xl px-4 py-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400",
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-slate-900 hover:text-white",
                  ].join(" ")
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {signOutError && (
        <p
          role="alert"
          className="mx-5 mb-4 rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-200"
        >
          {signOutError}
        </p>
      )}

      <div className="mt-auto hidden px-5 pb-8 lg:block">
        <button
          type="button"
          disabled={isSigningOut}
          onClick={() => void handleSignOut()}
          className="w-full rounded-xl border border-slate-700 px-4 py-3 text-left text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:bg-slate-900 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSigningOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </aside>
  );
}

export default AdminSidebar;
