/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const ThemeContext = createContext();

const THEME_KEY = "admin-theme";

export const ThemeProvider = ({ children }) => {
  const getSystemTheme = () =>
    window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches
      ? "dark"
      : "light";

  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem(THEME_KEY);
    return stored || getSystemTheme();
  });

  useEffect(() => {
    const root = document.documentElement;

    root.classList.remove("light", "dark");
    root.classList.add(theme);

    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) =>
      prev === "light" ? "dark" : "light"
    );

  return (
    <ThemeContext.Provider
      value={{ theme, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () =>
  useContext(ThemeContext);
