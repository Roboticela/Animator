/** Viewport lighting modes — HDR uses image-based lighting for realistic PBR surfaces. */
export type ViewportLightingMode = "flat" | "studio" | "hdr";

/** HDR environment maps served by @react-three/drei (Poly Haven). */
export type HdrEnvironmentPreset =
  | "warehouse"
  | "studio"
  | "apartment"
  | "city"
  | "sunset"
  | "forest";

export const LIGHTING_MODE_CYCLE: ViewportLightingMode[] = ["studio", "hdr", "flat"];

export const HDR_ENVIRONMENT_OPTIONS: {
  id: HdrEnvironmentPreset;
  label: string;
  hint: string;
}[] = [
  {
    id: "warehouse",
    label: "Warehouse",
    hint: "Neutral even HDR — best for reading true surface shape",
  },
  {
    id: "studio",
    label: "Studio",
    hint: "Clean product-style HDR",
  },
  {
    id: "apartment",
    label: "Apartment",
    hint: "Soft indoor natural light",
  },
  {
    id: "city",
    label: "City",
    hint: "Outdoor urban daylight",
  },
  {
    id: "sunset",
    label: "Sunset",
    hint: "Warm low-angle sunlight",
  },
  {
    id: "forest",
    label: "Forest",
    hint: "Dappled outdoor greenery",
  },
];

export function lightingModeLabel(mode: ViewportLightingMode): string {
  if (mode === "flat") return "Flat";
  if (mode === "studio") return "Studio";
  return "HDR";
}

export function nextLightingMode(mode: ViewportLightingMode): ViewportLightingMode {
  const index = LIGHTING_MODE_CYCLE.indexOf(mode);
  return LIGHTING_MODE_CYCLE[(index + 1) % LIGHTING_MODE_CYCLE.length]!;
}
