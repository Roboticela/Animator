export interface LayoutPreferences {
  leftWidth: number;
  rightWidth: number;
  timelineHeight: number;
  /** Top panel share in the left sidebar (0–1). */
  leftSplit: number;
  /** Top panel share in the right sidebar (0–1). */
  rightSplit: number;
}

const STORAGE_KEY = "animator-layout-v1";

export const LAYOUT_LIMITS = {
  leftWidth: { min: 200, max: 520 },
  rightWidth: { min: 220, max: 560 },
  timelineHeight: { min: 140, max: 720 },
  split: { min: 0.22, max: 0.78 },
} as const;

export const DEFAULT_LAYOUT: LayoutPreferences = {
  leftWidth: 272,
  rightWidth: 304,
  timelineHeight: 300,
  leftSplit: 0.58,
  rightSplit: 0.55,
};

export function loadLayoutPreferences(): LayoutPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_LAYOUT };
    const parsed = JSON.parse(raw) as Partial<LayoutPreferences>;
    return clampLayout({ ...DEFAULT_LAYOUT, ...parsed });
  } catch {
    return { ...DEFAULT_LAYOUT };
  }
}

export function saveLayoutPreferences(layout: LayoutPreferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clampLayout(layout)));
  } catch {
    /* ignore quota errors */
  }
}

export function clampLayout(layout: LayoutPreferences): LayoutPreferences {
  return {
    leftWidth: clamp(layout.leftWidth, LAYOUT_LIMITS.leftWidth.min, LAYOUT_LIMITS.leftWidth.max),
    rightWidth: clamp(layout.rightWidth, LAYOUT_LIMITS.rightWidth.min, LAYOUT_LIMITS.rightWidth.max),
    timelineHeight: clamp(layout.timelineHeight, LAYOUT_LIMITS.timelineHeight.min, LAYOUT_LIMITS.timelineHeight.max),
    leftSplit: clamp(layout.leftSplit, LAYOUT_LIMITS.split.min, LAYOUT_LIMITS.split.max),
    rightSplit: clamp(layout.rightSplit, LAYOUT_LIMITS.split.min, LAYOUT_LIMITS.split.max),
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
