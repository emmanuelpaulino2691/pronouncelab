import type { ReactNode } from "react";

import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

type MainLayoutProps = {
  children: ReactNode;
  immersive?: boolean;
};

function MainLayout({ children, immersive = false }: MainLayoutProps) {
  if (immersive) {
    return <main className="min-h-screen overflow-x-hidden bg-slate-50">{children}</main>;
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />

      <div className="flex flex-1 flex-col">
        <Header />

        <main className="min-w-0 flex-1 p-4 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
