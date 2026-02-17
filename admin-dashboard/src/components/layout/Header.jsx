import { Bars3Icon } from "@heroicons/react/24/outline";
import { useTheme } from "../../context/ThemeContext";
import { useDispatch } from "react-redux";
import { logout } from "../../features/auth/authSlice";
import {
  MoonIcon,
  SunIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

const Header = ({ toggleSidebar, isSidebarOpen }) => {
  const dispatch = useDispatch();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <header className="glass-surface min-h-[72px] shrink-0 border-b border-[var(--border-color)] px-6 py-4 transition-[background,color] duration-300 flex items-center justify-between">
      <button
        onClick={toggleSidebar}
        className="rounded-lg p-1.5 transition hover:bg-black/5 dark:hover:bg-white/10 lg:hidden"
        aria-label="Open Sidebar"
      >
        <Bars3Icon className="h-6 w-6 text-[var(--text-primary)]" />
      </button>

      <div className="ml-auto flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="glass-surface rounded-xl p-2 transition hover:scale-105 hover:bg-black/5 dark:hover:bg-white/10"
          aria-label="Toggle Theme"
        >
          {theme === "dark" ? (
            <SunIcon className="h-5 w-5 text-amber-400" />
          ) : (
            <MoonIcon className="h-5 w-5 text-[var(--text-muted)]" />
          )}
        </button>

        <div className="group relative flex items-center">
          <button
            type="button"
            className="glass-surface grid h-9 w-9 place-items-center rounded-full transition hover:scale-105"
            aria-label="System Admin"
          >
            <UserCircleIcon className="h-5 w-5 text-[var(--text-primary)]" />
          </button>
          <span
            role="tooltip"
            className="pointer-events-none absolute left-1/2 top-11 z-50 -translate-x-1/2 rounded-md border border-[var(--border-color)] bg-[var(--bg-secondary)] px-2 py-1 text-xs text-[var(--text-primary)] opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100"
          >
            System Admin
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-500/20 dark:text-red-300"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
