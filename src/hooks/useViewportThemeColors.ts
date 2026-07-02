import { useMemo } from "react";
import { useTheme } from "@/contexts/ThemeContext";

function readCssColor(variable: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return value || fallback;
}

/** Three.js viewport colors derived from the active `data-theme` CSS variables. */
export function useViewportThemeColors() {
  const { theme } = useTheme();

  return useMemo(
    () => ({
      background: readCssColor("--viewport-bg", "#0a0a0a"),
      gridCell: readCssColor("--viewport-grid-cell", "#243044"),
      gridSection: readCssColor("--viewport-grid-section", "#39506e"),
      sky: readCssColor("--primary", "#60a5fa"),
      ground: readCssColor("--background", "#0a0a0a"),
      axesX: readCssColor("--danger", "#f87171"),
      axesY: readCssColor("--success", "#34d399"),
      axesZ: readCssColor("--primary", "#60a5fa"),
    }),
    [theme]
  );
}
