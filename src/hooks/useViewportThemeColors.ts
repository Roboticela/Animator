import { useMemo } from "react";
import { useTheme } from "@/contexts/ThemeContext";

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

function channelToHex(channel: number): string {
  return Math.round(channel).toString(16).padStart(2, "0");
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${channelToHex(r)}${channelToHex(g)}${channelToHex(b)}`;
}

function parseRgbString(value: string): { r: number; g: number; b: number; a: number } | null {
  const match = value.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)/i);
  if (!match) return null;
  return {
    r: Number(match[1]),
    g: Number(match[2]),
    b: Number(match[3]),
    a: match[4] !== undefined ? Number(match[4]) : 1,
  };
}

function expandShortHex(hex: string): string {
  if (hex.length !== 4) return hex;
  return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
}

/** Normalize any CSS color to opaque #rrggbb for THREE.Color. */
function cssColorToHex(cssValue: string, fallback: string, blendOnto?: string): string {
  const trimmed = cssValue.trim();
  if (!trimmed) return fallback;

  if (/^#[0-9a-f]{3,8}$/i.test(trimmed)) {
    const hex = expandShortHex(trimmed.toLowerCase());
    return hex.slice(0, 7);
  }

  const parsed = parseRgbString(trimmed);
  if (parsed) {
    if (parsed.a >= 0.999) {
      return rgbToHex(parsed.r, parsed.g, parsed.b);
    }
    if (blendOnto && HEX_COLOR.test(blendOnto)) {
      const br = Number.parseInt(blendOnto.slice(1, 3), 16);
      const bg = Number.parseInt(blendOnto.slice(3, 5), 16);
      const bb = Number.parseInt(blendOnto.slice(5, 7), 16);
      const a = parsed.a;
      return rgbToHex(
        parsed.r * a + br * (1 - a),
        parsed.g * a + bg * (1 - a),
        parsed.b * a + bb * (1 - a)
      );
    }
  }

  if (typeof document === "undefined") return fallback;

  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d");
  if (!ctx) return fallback;

  if (blendOnto && HEX_COLOR.test(blendOnto)) {
    ctx.fillStyle = blendOnto;
    ctx.fillRect(0, 0, 1, 1);
  }

  try {
    ctx.fillStyle = trimmed;
  } catch {
    return fallback;
  }

  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
  if (a === 0) return fallback;
  if (a < 255 && blendOnto && HEX_COLOR.test(blendOnto)) {
    const br = Number.parseInt(blendOnto.slice(1, 3), 16);
    const bg = Number.parseInt(blendOnto.slice(3, 5), 16);
    const bb = Number.parseInt(blendOnto.slice(5, 7), 16);
    const alpha = a / 255;
    return rgbToHex(r * alpha + br * (1 - alpha), g * alpha + bg * (1 - alpha), b * alpha + bb * (1 - alpha));
  }

  const hex = rgbToHex(r, g, b);
  return HEX_COLOR.test(hex) ? hex : fallback;
}

function readCssColor(variable: string, fallback: string, blendOnto?: string): string {
  if (typeof window === "undefined") return fallback;

  const probe = document.createElement("div");
  probe.style.display = "none";
  probe.style.backgroundColor = `var(${variable})`;
  document.documentElement.appendChild(probe);

  try {
    const resolved = getComputedStyle(probe).backgroundColor.trim();
    if (!resolved || resolved === "rgba(0, 0, 0, 0)") return fallback;
    const hex = cssColorToHex(resolved, fallback, blendOnto);
    return HEX_COLOR.test(hex) ? hex : fallback;
  } finally {
    probe.remove();
  }
}

/** Three.js viewport colors derived from the active `data-theme` CSS variables. */
export function useViewportThemeColors() {
  const { theme } = useTheme();

  return useMemo(() => {
    const background = readCssColor("--viewport-bg", "#0a0a0a");
    return {
      background,
      gridCell: readCssColor("--viewport-grid-cell", "#243044", background),
      gridSection: readCssColor("--viewport-grid-section", "#39506e", background),
      sky: readCssColor("--primary", "#60a5fa"),
      ground: readCssColor("--background", "#0a0a0a"),
      axesX: readCssColor("--danger", "#f87171"),
      axesY: readCssColor("--success", "#34d399"),
      axesZ: readCssColor("--primary", "#60a5fa"),
    };
  }, [theme]);
}
