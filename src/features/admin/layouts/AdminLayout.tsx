import { Outlet } from "react-router-dom";

import AdminSidebar from "../components/AdminSidebar";

function AdminLayout() {
  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      <AdminSidebar />

      <div className="min-w-0 flex-1">
        <header className="border-b border-slate-200 bg-white px-5 py-5 sm:px-8 lg:px-10">
          <p className="text-sm font-medium text-slate-500">
            Improve your English every day.
          </p>
        </header>

        <main className="px-5 py-7 sm:px-8 lg:px-10 lg:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
