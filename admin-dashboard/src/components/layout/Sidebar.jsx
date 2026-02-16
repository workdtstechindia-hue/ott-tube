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
          className="fixed inset-0 bg-black bg-opacity-30 z-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={`
          fixed z-40 lg:static
          top-0 left-0 h-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-md dark:shadow-gray-900/40
          transition-all duration-300
          ${isCollapsed ? "w-20" : "w-64"}
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
        aria-label="Sidebar Navigation"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          {!isCollapsed && (
            <h1 className="text-lg font-semibold">Movie Admin</h1>
          )}
          <button
            onClick={toggleCollapse}
            className="hidden lg:block"
            aria-label="Toggle Sidebar Collapse"
          >
            <Bars3Icon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        <nav className="mt-4 space-y-1">
          {navItems.filter((item) => hasPermission(item.permission)).map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `
                  flex items-center gap-3 px-4 py-3 text-sm font-medium
                  transition-all duration-200
                  ${
                    isActive
                      ? "bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/70"
                  }
                `
                }
                onClick={handleNavClick}
              >
                <Icon className="w-5 h-5" />
                {!isCollapsed && <span>{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;

