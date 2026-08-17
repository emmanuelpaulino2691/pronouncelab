import type { StudentLayoutMode } from "../layouts/studentLayoutMode";
import { studentMenuButtonClass } from "../layouts/studentLayoutMode";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { signOutAccount } from "../../features/auth/sessionActions";
import { learnerAccountPresentation } from "../../features/auth/learnerAccountPresentation";
import { useLearnerRouteIdentity } from "../../features/auth/useLearnerRouteIdentity";
import { listMyNotifications } from "../../features/notifications/notificationService";

type Props = { layoutMode?: StudentLayoutMode; drawerOpen?: boolean; drawerId?: string; onOpenDrawer?: () => void };

export default function Header({ layoutMode = "auto", drawerOpen = false, drawerId, onOpenDrawer }: Props) {
  const location = useLocation();
  const identity = useLearnerRouteIdentity();
  const account = learnerAccountPresentation(identity);
  const session = identity.session;
  const [unreadCount,setUnreadCount]=useState(0);
  useEffect(()=>{let active=true;if(identity.kind!=="learner")return()=>{active=false};void listMyNotifications().then(rows=>{if(active)setUnreadCount(rows.filter(row=>!row.readAt).length)}).catch(()=>{if(active)setUnreadCount(0)});return()=>{active=false}},[identity.kind,location.pathname]);
  return (
    <header className={`flex min-w-0 items-center justify-between gap-3 border-b bg-white ${layoutMode === "phone" ? "px-3 py-3" : layoutMode === "tablet" ? "px-5 py-4" : "px-4 py-4 sm:px-8 sm:py-5"}`}>
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" aria-label="Open student navigation" aria-expanded={drawerOpen} aria-controls={drawerId} onClick={onOpenDrawer} className={`${studentMenuButtonClass(layoutMode)} min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-300 text-xl text-slate-800 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600`}><span aria-hidden="true">☰</span></button>
        <span className={`${layoutMode === "phone" ? "text-lg" : "text-xl"} truncate font-bold text-slate-950`}>PronounceLab</span>
      </div>
      <div className="flex min-w-0 items-center gap-2">
        <div className="min-w-0 max-w-32 text-right sm:max-w-56">
          <p className={`text-xs font-bold uppercase tracking-wide ${account.kind === "synced" ? "text-emerald-700" : account.kind === "staff" ? "text-blue-700" : "text-slate-500"}`}>{account.label}</p>
          <p className="hidden max-w-56 truncate text-xs text-slate-600 md:block">{account.detail}</p>
        </div>
        {identity.kind === "staff" && <Link to="/admin" className="inline-flex min-h-11 items-center rounded-xl bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">Content Studio</Link>}
        {identity.kind === "learner" && <Link to="/notifications" aria-label={unreadCount>0?`${unreadCount} unread notifications`:"Notifications"} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"><span aria-hidden="true">🔔</span>{unreadCount>0&&<span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">{unreadCount}</span>}</Link>}
        {session ? <button type="button" onClick={() => { if (supabase) void signOutAccount(supabase.auth); }} className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">Sign out</button> : <Link to="/login" state={{ from: `${location.pathname}${location.search}` }} className="inline-flex min-h-11 items-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">Sign in</Link>}
      </div>
    </header>
  );
}
