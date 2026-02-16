import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950 overflow-hidden transition-colors">
      <Sidebar
        isOpen={isSidebarOpen}
        isCollapsed={isCollapsed}
        toggleSidebar={toggleSidebar}
        toggleCollapse={toggleCollapse}
      />

      <div className="flex-1 flex flex-col">
        <Header toggleSidebar={toggleSidebar} />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-md dark:shadow-gray-900/40 rounded-xl p-6 min-h-full transition-colors">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
