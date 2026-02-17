import {
  HomeIcon,
  FilmIcon,
  UsersIcon,
  ShoppingCartIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline";
import { NavLink } from "react-router-dom";
import useRole from "../../hooks/useRole";

const Sidebar = ({
  isOpen,
  isCollapsed,
  toggleSidebar,
  toggleCollapse,
}) => {
  const { hasPermission } = useRole();

  const navItems = [
    {
      name: "Dashboard",
      path: "/",
      icon: HomeIcon,
      permission: "DASHBOARD_VIEW",
    },
    {
      name: "Movies",
      path: "/movies",
      icon: FilmIcon,
      permission: "MOVIE_MANAGE",
    },
    {
      name: "Users",
      path: "/users",
      icon: UsersIcon,
      permission: "USER_MANAGE",
    },
    {
      name: "Purchases",
      path: "/purchases",
      icon: ShoppingCartIcon,
      permission: "PURCHASE_VIEW",
    },
  ];

  const handleNavClick = () => {
    if (isOpen) toggleSidebar();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/35 backdrop-blur-sm lg:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      <aside
        id="admin-sidebar"
        className={`
          fixed z-40 lg:static
          top-0 left-0 h-full glass-surface border-r border-[var(--border-color)] text-[var(--text-primary)] shadow-md
          transition-all duration-300
          ${isCollapsed ? "w-20" : "w-64"}
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
        aria-label="Sidebar Navigation"
      >
        <div className="flex items-center justify-between border-b border-[var(--border-color)] p-4">
          {!isCollapsed && (
            <h1 className="text-lg font-semibold tracking-tight">
              OTT Admin
            </h1>
          )}
          <button
            onClick={toggleCollapse}
            className="hidden rounded-lg p-1.5 transition hover:bg-black/5 dark:hover:bg-white/10 lg:block"
            aria-label="Toggle Sidebar Collapse"
          >
            <Bars3Icon className="h-6 w-6 text-[var(--text-muted)]" />
          </button>
        </div>

        <nav className="mt-4 space-y-1 px-2">
          {navItems.filter((item) => hasPermission(item.permission)).map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `
                  relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200
                  ${
                    isActive
                      ? "bg-gradient-to-r from-blue-500/15 to-cyan-400/10 text-blue-600 dark:text-blue-300"
                      : "text-[var(--text-muted)] hover:bg-black/5 hover:text-[var(--text-primary)] dark:hover:bg-white/10"
                  }
                  before:absolute before:bottom-2 before:left-1 before:top-2 before:w-1 before:rounded-full before:bg-blue-500 before:transition-opacity
                  ${isActive ? "before:opacity-100" : "before:opacity-0"}
                `
                }
                onClick={handleNavClick}
              >
                <Icon className="w-5 h-5" />
                <span className={isCollapsed ? "lg:hidden" : ""}>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;

