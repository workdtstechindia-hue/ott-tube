import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  useEffect(() => {
    if (!isSidebarOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors">
      <Sidebar
        isOpen={isSidebarOpen}
        isCollapsed={isCollapsed}
        toggleSidebar={toggleSidebar}
        toggleCollapse={toggleCollapse}
      />

      <div className="flex flex-1 flex-col">
        <Header toggleSidebar={toggleSidebar} />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="card-surface min-h-full rounded-2xl p-6 app-ease">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
