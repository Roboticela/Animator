import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeName = "navy" | "dark" | "light" | "sunset" | "ocean" | "forest" | "purple" | "midnight";

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

const STORAGE_KEY = "animator:theme";

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function readInitialTheme(): ThemeName {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  const valid: ThemeName[] = ["navy", "dark", "light", "sunset", "ocean", "forest", "purple", "midnight"];
  return valid.includes(stored as ThemeName) ? (stored as ThemeName) : "dark";
}

function applyTheme(theme: ThemeName) {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.classList.remove("dark");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(readInitialTheme);

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = (next: ThemeName) => setThemeState(next);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}

// eslint-disable-next-line react-refresh/only-export-components
export const THEMES: { name: ThemeName; label: string; colors: string }[] = [
  { name: "navy", label: "Navy", colors: "bg-blue-900" },
  { name: "dark", label: "Dark", colors: "bg-gray-900" },
  { name: "light", label: "Light", colors: "bg-gray-100" },
  { name: "sunset", label: "Sunset", colors: "bg-orange-500" },
  { name: "ocean", label: "Ocean", colors: "bg-cyan-500" },
  { name: "forest", label: "Forest", colors: "bg-green-700" },
  { name: "purple", label: "Purple Dream", colors: "bg-purple-600" },
  { name: "midnight", label: "Midnight", colors: "bg-indigo-900" },
];
