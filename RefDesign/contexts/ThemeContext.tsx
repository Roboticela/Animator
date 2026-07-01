"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type ThemeName = "navy" | "dark" | "light" | "sunset" | "ocean" | "forest" | "purple" | "midnight";

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  glowEnabled: boolean;
  toggleGlow: () => void;
  setGlowEnabled: (enabled: boolean) => void;
  resetTheme: (theme?: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>("dark");
  const [glowEnabled, setGlowEnabled] = useState(false);

  const applyTheme = (themeName: ThemeName) => {
    const root = document.documentElement;
    root.setAttribute("data-theme", themeName);
  };

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
  };

  const toggleGlow = () => {
    setGlowEnabled((prev) => !prev);
  };

  const resetTheme = (themeName: ThemeName = "dark") => {
    setGlowEnabled(false);
    setThemeState(themeName);
    applyTheme(themeName);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, glowEnabled, toggleGlow, setGlowEnabled, resetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
