export type KeyframeEasingId =
  | "linear"
  | "easeIn"
  | "easeOut"
  | "easeInOut"
  | "smooth"
  | "sineIn"
  | "sineOut"
  | "sineInOut"
  | "expoIn"
  | "expoOut"
  | "quartIn"
  | "quartOut"
  | "hold"
  | "easeInBack"
  | "easeOutBack"
  | "anticipate"
  | "overshoot"
  | "bounce"
  | "elastic";

export interface KeyframeEasingDef {
  id: KeyframeEasingId;
  name: string;
  shortLabel: string;
  description: string;
}

export const KEYFRAME_EASINGS: KeyframeEasingDef[] = [
  { id: "linear", name: "Linear", shortLabel: "Lin", description: "Constant speed" },
  { id: "easeIn", name: "Fade In", shortLabel: "In", description: "Slow start, accelerates" },
  { id: "easeOut", name: "Fade Out", shortLabel: "Out", description: "Slow end, decelerates" },
  { id: "easeInOut", name: "Fade In/Out", shortLabel: "InOut", description: "Smooth start and end" },
  { id: "smooth", name: "Smooth", shortLabel: "Smooth", description: "Silky sine ease both ways" },
  { id: "sineIn", name: "Sine In", shortLabel: "Sin↑", description: "Gentle acceleration curve" },
  { id: "sineOut", name: "Sine Out", shortLabel: "Sin↓", description: "Gentle deceleration curve" },
  { id: "sineInOut", name: "Sine In/Out", shortLabel: "Sin", description: "Natural S-curve" },
  { id: "expoIn", name: "Expo In", shortLabel: "Ex↑", description: "Dramatic slow start" },
  { id: "expoOut", name: "Expo Out", shortLabel: "Ex↓", description: "Dramatic slow end" },
  { id: "quartIn", name: "Quart In", shortLabel: "Q↑", description: "Strong ease-in" },
  { id: "quartOut", name: "Quart Out", shortLabel: "Q↓", description: "Strong ease-out" },
  { id: "hold", name: "Hold", shortLabel: "Hold", description: "Snap at next keyframe" },
  { id: "easeInBack", name: "In Back", shortLabel: "Back", description: "Pull back then launch" },
  { id: "easeOutBack", name: "Out Back", shortLabel: "OBack", description: "Overshoot then settle" },
  { id: "anticipate", name: "Anticipate", shortLabel: "Ant", description: "Wind-up before motion" },
  { id: "overshoot", name: "Overshoot", shortLabel: "Over", description: "Pass target then return" },
  { id: "bounce", name: "Bounce", shortLabel: "Bnc", description: "Bouncy landing" },
  { id: "elastic", name: "Elastic", shortLabel: "Ela", description: "Springy wobble" },
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

function easeInQuart(t: number) {
  return t * t * t * t;
}

function easeOutQuart(t: number) {
  return 1 - Math.pow(1 - t, 4);
}

function easeInExpo(t: number) {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10);
}

function easeOutExpo(t: number) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function easeInSine(t: number) {
  return 1 - Math.cos((t * Math.PI) / 2);
}

function easeOutSine(t: number) {
  return Math.sin((t * Math.PI) / 2);
}

function easeInOutSine(t: number) {
  return -(Math.cos(Math.PI * t) - 1) / 2;
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
    case "smooth":
      return easeInOutSine(u);
    case "sineIn":
      return easeInSine(u);
    case "sineOut":
      return easeOutSine(u);
    case "sineInOut":
      return easeInOutSine(u);
    case "expoIn":
      return easeInExpo(u);
    case "expoOut":
      return easeOutExpo(u);
    case "quartIn":
      return easeInQuart(u);
    case "quartOut":
      return easeOutQuart(u);
    case "hold":
      return u >= 1 ? 1 : 0;
    case "easeInBack":
    case "anticipate":
      return easeInBack(u);
    case "easeOutBack":
    case "overshoot":
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

export const KEYFRAME_EASING_COLORS: Record<KeyframeEasingId, string> = {
  linear: "bg-zinc-500/80 border-zinc-400",
  easeIn: "bg-sky-500/85 border-sky-300",
  easeOut: "bg-violet-500/85 border-violet-300",
  easeInOut: "bg-indigo-500/85 border-indigo-300",
  smooth: "bg-cyan-500/85 border-cyan-300",
  sineIn: "bg-blue-500/85 border-blue-300",
  sineOut: "bg-purple-500/85 border-purple-300",
  sineInOut: "bg-fuchsia-500/85 border-fuchsia-300",
  expoIn: "bg-orange-500/85 border-orange-300",
  expoOut: "bg-amber-500/85 border-amber-300",
  quartIn: "bg-rose-500/85 border-rose-300",
  quartOut: "bg-pink-500/85 border-pink-300",
  hold: "bg-yellow-500/85 border-yellow-300",
  easeInBack: "bg-orange-600/85 border-orange-400",
  easeOutBack: "bg-rose-600/85 border-rose-400",
  anticipate: "bg-red-500/85 border-red-300",
  overshoot: "bg-emerald-500/85 border-emerald-300",
  bounce: "bg-lime-500/85 border-lime-300",
  elastic: "bg-teal-500/85 border-teal-300",
};

export const KEYFRAME_SEGMENT_GRADIENTS: Record<KeyframeEasingId, string> = {
  linear: "from-zinc-500/25 to-zinc-500/5",
  easeIn: "from-sky-500/35 to-sky-500/5",
  easeOut: "from-violet-500/35 to-violet-500/5",
  easeInOut: "from-indigo-500/35 to-indigo-500/5",
  smooth: "from-cyan-500/35 to-cyan-500/5",
  sineIn: "from-blue-500/35 to-blue-500/5",
  sineOut: "from-purple-500/35 to-purple-500/5",
  sineInOut: "from-fuchsia-500/35 to-fuchsia-500/5",
  expoIn: "from-orange-500/35 to-orange-500/5",
  expoOut: "from-amber-500/35 to-amber-500/5",
  quartIn: "from-rose-500/35 to-rose-500/5",
  quartOut: "from-pink-500/35 to-pink-500/5",
  hold: "from-yellow-500/35 to-yellow-500/5",
  easeInBack: "from-orange-600/35 to-orange-600/5",
  easeOutBack: "from-rose-600/35 to-rose-600/5",
  anticipate: "from-red-500/35 to-red-500/5",
  overshoot: "from-emerald-500/35 to-emerald-500/5",
  bounce: "from-lime-500/35 to-lime-500/5",
  elastic: "from-teal-500/35 to-teal-500/5",
};
