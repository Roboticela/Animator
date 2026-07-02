export type KeyframeEasingId =
  | "linear"
  | "easeIn"
  | "easeOut"
  | "easeInOut"
  | "hold"
  | "easeInBack"
  | "easeOutBack"
  | "bounce"
  | "elastic";

export interface KeyframeEasingDef {
  id: KeyframeEasingId;
  name: string;
  description: string;
}

/** Easing presets for timeline segments (outgoing from a keyframe to the next). */
export const KEYFRAME_EASINGS: KeyframeEasingDef[] = [
  { id: "linear", name: "Linear", description: "Constant speed" },
  { id: "easeIn", name: "Fade In", description: "Slow start, accelerates" },
  { id: "easeOut", name: "Fade Out", description: "Slow end, decelerates" },
  { id: "easeInOut", name: "Fade In/Out", description: "Smooth start and end" },
  { id: "hold", name: "Hold", description: "Stay until next keyframe, then snap" },
  { id: "easeInBack", name: "Ease In Back", description: "Overshoot backward then forward" },
  { id: "easeOutBack", name: "Ease Out Back", description: "Overshoot past target" },
  { id: "bounce", name: "Bounce", description: "Bouncy landing" },
  { id: "elastic", name: "Elastic", description: "Springy overshoot" },
];

export function clamp01(t: number) {
  return Math.max(0, Math.min(1, t));
}

function easeInCubic(t: number) {
  return t * t * t;
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeInBack(t: number) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return c3 * t * t * t - c1 * t * t;
}

function easeOutBack(t: number) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function easeOutBounce(t: number) {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
  return n1 * (t -= 2.625 / d1) * t + 0.984375;
}

function easeOutElastic(t: number) {
  if (t === 0 || t === 1) return t;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
}

/** Maps normalized time [0,1] through the easing curve. */
export function applyKeyframeEasing(id: KeyframeEasingId, t: number): number {
  const u = clamp01(t);
  switch (id) {
    case "linear":
      return u;
    case "easeIn":
      return easeInCubic(u);
    case "easeOut":
      return easeOutCubic(u);
    case "easeInOut":
      return easeInOutCubic(u);
    case "hold":
      return u >= 1 ? 1 : 0;
    case "easeInBack":
      return easeInBack(u);
    case "easeOutBack":
      return easeOutBack(u);
    case "bounce":
      return easeOutBounce(u);
    case "elastic":
      return easeOutElastic(u);
    default:
      return u;
  }
}

export function getKeyframeEasingDef(id: KeyframeEasingId) {
  return KEYFRAME_EASINGS.find((e) => e.id === id);
}

export const DEFAULT_KEYFRAME_EASING: KeyframeEasingId = "linear";

/** Tailwind classes for timeline keyframe diamonds per easing type. */
export const KEYFRAME_EASING_COLORS: Record<KeyframeEasingId, string> = {
  linear: "bg-secondary/90 border-secondary",
  easeIn: "bg-sky-500/90 border-sky-400",
  easeOut: "bg-violet-500/90 border-violet-400",
  easeInOut: "bg-indigo-500/90 border-indigo-400",
  hold: "bg-amber-500/90 border-amber-400",
  easeInBack: "bg-orange-500/90 border-orange-400",
  easeOutBack: "bg-rose-500/90 border-rose-400",
  bounce: "bg-emerald-500/90 border-emerald-400",
  elastic: "bg-teal-500/90 border-teal-400",
};
