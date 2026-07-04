import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { HexColorPicker, HexColorInput, RgbColorPicker, HslColorPicker } from "react-colorful";
import type { RgbColor, HslColor } from "react-colorful";
import { useTheme, type ThemeName } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

export interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
  /** When below 1, shows checkerboard overlay on the swatch (RefCode transparent style). */
  opacity?: number;
  className?: string;
  title?: string;
}

const getThemePalette = (theme: ThemeName): string[] => {
  const palettes: Record<ThemeName, string[]> = {
    navy: [
      "#0f172a", "#1e293b", "#334155", "#475569", "#64748b", "#94a3b8", "#cbd5e1", "#e2e8f0",
      "#3b82f6", "#60a5fa", "#93c5fd", "#dbeafe", "#1e40af", "#1e3a8a", "#1e293b", "#0f172a",
    ],
    dark: [
      "#0a0a0a", "#1a1a1a", "#2a2a2a", "#3a3a3a", "#4a4a4a", "#6b7280", "#9ca3af", "#ededed",
      "#525252", "#737373", "#a3a3a3", "#d4d4d4", "#171717", "#262626", "#404040", "#525252",
    ],
    light: [
      "#ffffff", "#f9fafb", "#f3f4f6", "#e5e7eb", "#d1d5db", "#9ca3af", "#6b7280", "#171717",
      "#f5f5f5", "#e5e5e5", "#d4d4d4", "#a3a3a3", "#737373", "#525252", "#404040", "#262626",
    ],
    sunset: [
      "#fff7ed", "#ffedd5", "#fed7aa", "#fdba74", "#fb923c", "#f97316", "#ea580c", "#c2410c",
      "#7c2d12", "#9a3412", "#b45309", "#d97706", "#f59e0b", "#fbbf24", "#fcd34d", "#fde68a",
    ],
    ocean: [
      "#e0f2fe", "#bae6fd", "#7dd3fc", "#38bdf8", "#22d3ee", "#06b6d4", "#0891b2", "#0e7490",
      "#164e63", "#155e75", "#0c4a6e", "#075985", "#0369a1", "#0284c7", "#0ea5e9", "#38bdf8",
    ],
    forest: [
      "#f0fdf4", "#dcfce7", "#bbf7d0", "#86efac", "#4ade80", "#22c55e", "#16a34a", "#15803d",
      "#14532d", "#166534", "#15803d", "#16a34a", "#22c55e", "#4ade80", "#86efac", "#bbf7d0",
    ],
    purple: [
      "#faf5ff", "#f3e8ff", "#e9d5ff", "#d8b4fe", "#c084fc", "#a855f7", "#9333ea", "#7c3aed",
      "#581c87", "#6b21a8", "#7c3aed", "#9333ea", "#a855f7", "#c084fc", "#d8b4fe", "#e9d5ff",
    ],
    midnight: [
      "#e0e7ff", "#c7d2fe", "#a5b4fc", "#818cf8", "#6366f1", "#4f46e5", "#4338ca", "#3730a3",
      "#1e1b4b", "#312e81", "#4338ca", "#4f46e5", "#6366f1", "#818cf8", "#a5b4fc", "#c7d2fe",
    ],
  };
  return palettes[theme] || palettes.dark;
};

const hexToRgb = (hex: string): RgbColor | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

const rgbToHex = (r: number, g: number, b: number): string => {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
};

const rgbToHsl = (r: number, g: number, b: number): HslColor => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
};

const hslToRgb = (hsl: HslColor): RgbColor => {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  let r: number;
  let g: number;
  let b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
};

const TRANSPARENT_CHECKER = `linear-gradient(45deg, #e5e5e5 25%, transparent 25%), linear-gradient(-45deg, #e5e5e5 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e5e5 75%), linear-gradient(-45deg, transparent 75%, #e5e5e5 75%)`;

/** RefCode ThemeColorPicker — same layout, classes, and react-colorful styling. */
export function ColorPicker({
  value,
  onChange,
  disabled = false,
  opacity = 1,
  className,
  title = "Pick a color",
}: ColorPickerProps) {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [currentColor, setCurrentColor] = useState(value === "transparent" ? "#ffffff" : value);
  const [colorMode, setColorMode] = useState<"hex" | "rgb" | "hsl">("hex");
  const [rgb, setRgb] = useState<RgbColor>({ r: 255, g: 255, b: 255 });
  const [hsl, setHsl] = useState<HslColor>({ h: 0, s: 100, l: 50 });
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const onChangeTimeoutRef = useRef<number | null>(null);
  const palette = getThemePalette(theme);
  const showTransparentOverlay = opacity < 0.999;

  useEffect(() => {
    if (value !== "transparent") {
      setCurrentColor(value);
      const rgbValue = hexToRgb(value);
      if (rgbValue) {
        setRgb(rgbValue);
        setHsl(rgbToHsl(rgbValue.r, rgbValue.g, rgbValue.b));
      }
    }
  }, [value]);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const calculatePosition = () => {
        if (!buttonRef.current) return;

        const rect = buttonRef.current.getBoundingClientRect();
        const popupWidth = 288;
        const popupHeight = 500;
        const spacing = 8;

        let top = rect.bottom + window.scrollY + spacing;
        let left = rect.left + window.scrollX;

        if (left + popupWidth > window.innerWidth) {
          left = window.innerWidth - popupWidth - spacing;
        }

        if (left < spacing) {
          left = spacing;
        }

        if (top + popupHeight > window.innerHeight + window.scrollY) {
          top = rect.top + window.scrollY - popupHeight - spacing;
          if (top < window.scrollY) {
            top = window.scrollY + spacing;
          }
        }

        setPopupPosition({ top, left });
      };

      calculatePosition();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const debouncedOnChange = useCallback(
    (color: string) => {
      if (onChangeTimeoutRef.current !== null) {
        clearTimeout(onChangeTimeoutRef.current);
      }
      onChangeTimeoutRef.current = window.setTimeout(() => {
        onChange(color);
        onChangeTimeoutRef.current = null;
      }, 50);
    },
    [onChange]
  );

  const handleHexChange = useCallback(
    (color: string) => {
      setCurrentColor(color);
      const rgbValue = hexToRgb(color);
      if (rgbValue) {
        setRgb(rgbValue);
        setHsl(rgbToHsl(rgbValue.r, rgbValue.g, rgbValue.b));
      }
      debouncedOnChange(color);
    },
    [debouncedOnChange]
  );

  const handleRgbChange = useCallback(
    (color: RgbColor) => {
      setRgb(color);
      const hex = rgbToHex(color.r, color.g, color.b);
      setCurrentColor(hex);
      setHsl(rgbToHsl(color.r, color.g, color.b));
      debouncedOnChange(hex);
    },
    [debouncedOnChange]
  );

  const handleHslChange = useCallback(
    (color: HslColor) => {
      setHsl(color);
      const rgbValue = hslToRgb(color);
      setRgb(rgbValue);
      const hex = rgbToHex(rgbValue.r, rgbValue.g, rgbValue.b);
      setCurrentColor(hex);
      debouncedOnChange(hex);
    },
    [debouncedOnChange]
  );

  useEffect(() => {
    return () => {
      if (onChangeTimeoutRef.current) {
        clearTimeout(onChangeTimeoutRef.current);
      }
    };
  }, []);

  const popupContent = useMemo(() => {
    if (!isOpen) return null;

    return (
      <AnimatePresence key="color-picker-popup">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.2 }}
          className="fixed z-[9999] w-72 max-h-[85vh] overflow-y-auto rounded-lg border border-border bg-card p-3 shadow-lg"
          style={{
            boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            top: `${popupPosition.top}px`,
            left: `${popupPosition.left}px`,
          }}
          ref={pickerRef}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">Pick a color</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-foreground/60 transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-3 flex gap-1.5">
            <button
              type="button"
              onClick={() => setColorMode("hex")}
              className={`rounded px-3 py-1 text-[10px] transition-colors ${
                colorMode === "hex"
                  ? "bg-primary text-primary-foreground"
                  : "bg-accent/20 text-foreground/70 hover:bg-accent/30"
              }`}
            >
              HEX
            </button>
            <button
              type="button"
              onClick={() => setColorMode("rgb")}
              className={`rounded px-3 py-1 text-[10px] transition-colors ${
                colorMode === "rgb"
                  ? "bg-primary text-primary-foreground"
                  : "bg-accent/20 text-foreground/70 hover:bg-accent/30"
              }`}
            >
              RGB
            </button>
            <button
              type="button"
              onClick={() => setColorMode("hsl")}
              className={`rounded px-3 py-1 text-[10px] transition-colors ${
                colorMode === "hsl"
                  ? "bg-primary text-primary-foreground"
                  : "bg-accent/20 text-foreground/70 hover:bg-accent/30"
              }`}
            >
              HSL
            </button>
          </div>

          <div className="mb-3 flex justify-center">
            <style>{`
              .react-colorful {
                width: 100%;
                height: 150px;
              }
              .react-colorful__saturation {
                border-radius: 6px 6px 0 0;
              }
              .react-colorful__hue,
              .react-colorful__alpha {
                height: 16px;
                border-radius: 0 0 6px 6px;
              }
              .react-colorful__pointer {
                width: 14px;
                height: 14px;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              }
            `}</style>
            {colorMode === "hex" && <HexColorPicker color={currentColor} onChange={handleHexChange} />}
            {colorMode === "rgb" && <RgbColorPicker color={rgb} onChange={handleRgbChange} />}
            {colorMode === "hsl" && <HslColorPicker color={hsl} onChange={handleHslChange} />}
          </div>

          <div className="mb-3">
            <div
              className="mb-1.5 h-16 w-full rounded-lg border border-border"
              style={{
                backgroundColor: currentColor,
                opacity: showTransparentOverlay ? opacity : 1,
                backgroundImage: showTransparentOverlay ? TRANSPARENT_CHECKER : undefined,
                backgroundSize: showTransparentOverlay ? "8px 8px" : undefined,
                backgroundPosition: showTransparentOverlay ? "0 0, 0 4px, 4px -4px, -4px 0px" : undefined,
              }}
            />
            <div className="text-center font-mono text-[10px] text-foreground/70">{currentColor.toUpperCase()}</div>
          </div>

          <div className="mb-2">
            {colorMode === "hex" && (
              <div>
                <div className="mb-1 text-[10px] text-foreground/70">HEX</div>
                <HexColorInput
                  color={currentColor}
                  onChange={handleHexChange}
                  prefixed
                  className="w-full rounded border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
            )}
            {colorMode === "rgb" && (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <div className="mb-1 text-[10px] text-foreground/70">R</div>
                  <input
                    type="number"
                    min={0}
                    max={255}
                    value={rgb.r}
                    onChange={(e) => handleRgbChange({ ...rgb, r: parseInt(e.target.value, 10) || 0 })}
                    className="w-full rounded border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <div className="mb-1 text-[10px] text-foreground/70">G</div>
                  <input
                    type="number"
                    min={0}
                    max={255}
                    value={rgb.g}
                    onChange={(e) => handleRgbChange({ ...rgb, g: parseInt(e.target.value, 10) || 0 })}
                    className="w-full rounded border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <div className="mb-1 text-[10px] text-foreground/70">B</div>
                  <input
                    type="number"
                    min={0}
                    max={255}
                    value={rgb.b}
                    onChange={(e) => handleRgbChange({ ...rgb, b: parseInt(e.target.value, 10) || 0 })}
                    className="w-full rounded border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
              </div>
            )}
            {colorMode === "hsl" && (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <div className="mb-1 text-[10px] text-foreground/70">H</div>
                  <input
                    type="number"
                    min={0}
                    max={360}
                    value={hsl.h}
                    onChange={(e) => handleHslChange({ ...hsl, h: parseInt(e.target.value, 10) || 0 })}
                    className="w-full rounded border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <div className="mb-1 text-[10px] text-foreground/70">S</div>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={hsl.s}
                    onChange={(e) => handleHslChange({ ...hsl, s: parseInt(e.target.value, 10) || 0 })}
                    className="w-full rounded border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <div className="mb-1 text-[10px] text-foreground/70">L</div>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={hsl.l}
                    onChange={(e) => handleHslChange({ ...hsl, l: parseInt(e.target.value, 10) || 0 })}
                    className="w-full rounded border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }, [
    isOpen,
    popupPosition,
    colorMode,
    currentColor,
    rgb,
    hsl,
    palette,
    handleHexChange,
    handleRgbChange,
    handleHslChange,
    opacity,
    showTransparentOverlay,
  ]);

  return (
    <>
      <div className={cn("relative", className)}>
        <button
          type="button"
          ref={buttonRef}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="h-10 w-10 cursor-pointer rounded-lg border-2 border-border transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            backgroundColor: currentColor,
            opacity: showTransparentOverlay ? opacity : 1,
            appearance: "none",
            WebkitAppearance: "none",
            MozAppearance: "none",
          }}
          title={title}
        />
        {showTransparentOverlay && (
          <div
            className="pointer-events-none absolute inset-0 z-10 rounded-lg"
            style={{
              backgroundImage: TRANSPARENT_CHECKER,
              backgroundSize: "8px 8px",
              backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
            }}
          />
        )}
      </div>
      {typeof window !== "undefined" && isOpen && createPortal(popupContent, document.body)}
    </>
  );
}
