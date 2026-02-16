import { Bars3Icon } from "@heroicons/react/24/outline";
import { useTheme } from "../../context/ThemeContext";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../features/auth/authSlice";
import {
  MoonIcon,
  SunIcon,
} from "@heroicons/react/24/outline";

const Header = ({ toggleSidebar }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 transition-colors duration-300 px-6 py-4 flex items-center justify-between">
      <button
        onClick={toggleSidebar}
        className="lg:hidden"
        aria-label="Open Sidebar"
      >
        <Bars3Icon className="w-6 h-6 text-gray-700" />
      </button>

      <div className="flex items-center gap-4 ml-auto">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          aria-label="Toggle Theme"
        >
          {theme === "dark" ? (
            <SunIcon className="w-5 h-5 text-yellow-400" />
          ) : (
            <MoonIcon className="w-5 h-5 text-gray-700" />
          )}
        </button>

        <span className="text-sm text-gray-600 dark:text-gray-300">
          {user?.name || "Admin"}
        </span>

        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
