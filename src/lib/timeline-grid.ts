/** Adaptive timeline grid — seconds down to microseconds based on zoom. */

const NICE = [1, 2, 5, 10];

export interface TimelineGridSteps {
  /** Labeled ruler ticks (~96px apart). */
  major: number;
  /** Medium grid lines (~24px apart). */
  minor: number;
  /** Finest grid lines (~6px apart, divides minor evenly). */
  fine: number;
}

export function snapToNiceStep(seconds: number): number {
  if (!Number.isFinite(seconds) || seconds <= 0) return 1;
  const exp = 10 ** Math.floor(Math.log10(seconds));
  const frac = seconds / exp;
  for (const m of NICE) {
    if (frac <= m) return m * exp;
  }
  return 10 * exp;
}

export function pickStepForPixels(pixelsPerSecond: number, targetPx: number): number {
  if (pixelsPerSecond <= 0) return 1;
  return snapToNiceStep(targetPx / pixelsPerSecond);
}

const MIN_LINE_PX = 2;

export function getTimelineGridSteps(pixelsPerSecond: number): TimelineGridSteps {
  let major = pickStepForPixels(pixelsPerSecond, 96);
  let minor = pickStepForPixels(pixelsPerSecond, 24);
  let fine = pickStepForPixels(pixelsPerSecond, 6);

  if (minor > major) minor = major / 2 || major;
  if (fine > minor) fine = minor / 5 || minor / 2 || minor;

  // Fine must divide minor so grid lines align with no gaps.
  const ratio = minor / fine;
  if (ratio > 1 && Math.abs(ratio - Math.round(ratio)) > 1e-6) {
    fine = minor / Math.max(1, Math.round(ratio));
  }

  const minFine = MIN_LINE_PX / pixelsPerSecond;
  if (fine < minFine) fine = minFine;
  if (minor < fine) minor = fine;
  if (major < minor) major = minor;

  return { major, minor, fine };
}

export function stepToPixels(step: number, pixelsPerSecond: number) {
  return step * pixelsPerSecond;
}

/** Enumerate tick times in [from, to] inclusive. */
export function ticksInRange(from: number, to: number, step: number, duration: number): number[] {
  if (step <= 0 || to < from) return [];
  const cap = Math.max(0, duration);
  const end = Math.min(to, cap);
  const start = Math.max(0, Math.floor(from / step - 1e-9) * step);
  const out: number[] = [];
  const maxTicks = 4000;
  for (let i = 0, t = start; t <= end + step * 0.5 && i < maxTicks; i++, t += step) {
    out.push(roundTime(t));
  }
  return out;
}

export function roundTime(t: number) {
  if (t === 0) return 0;
  const mag = Math.abs(t);
  const digits = mag >= 1 ? 6 : mag >= 0.001 ? 9 : 12;
  return Number(t.toFixed(digits));
}

function decimalPlaces(step: number): number {
  if (step >= 1) return step >= 10 ? 0 : 1;
  if (step >= 0.1) return 2;
  if (step >= 0.01) return 3;
  if (step >= 0.001) return 1; // ms integers often
  if (step >= 0.0001) return 2;
  if (step >= 0.00001) return 3;
  return 4;
}

/** Human label for a ruler tick — s, ms, or µs depending on step scale. */
export function formatTimelineLabel(time: number, step: number): string {
  const d = decimalPlaces(step);
  const trim = (n: number) => {
    const s = n.toFixed(d);
    return s.replace(/\.?0+$/, "");
  };

  if (step >= 1) return `${trim(time)}s`;
  if (step >= 0.001) return `${trim(time * 1000)}ms`;
  if (step >= 0.000001) return `${trim(time * 1_000_000)}µs`;
  return `${trim(time * 1_000_000_000)}ns`;
}

/** CSS repeating gradients for a gapless vertical grid. */
export function timelineGridBackground(steps: TimelineGridSteps, pixelsPerSecond: number): string {
  const finePx = Math.max(MIN_LINE_PX, stepToPixels(steps.fine, pixelsPerSecond));
  const minorPx = Math.max(finePx, stepToPixels(steps.minor, pixelsPerSecond));

  const fineLine = `hsl(var(--foreground) / 0.06)`;
  const minorLine = `hsl(var(--foreground) / 0.14)`;

  return [
    `repeating-linear-gradient(to right, ${fineLine} 0, ${fineLine} 1px, transparent 1px, transparent ${finePx}px)`,
    `repeating-linear-gradient(to right, ${minorLine} 0, ${minorLine} 1px, transparent 1px, transparent ${minorPx}px)`,
  ].join(", ");
}

export function isMajorTick(time: number, majorStep: number) {
  if (majorStep <= 0) return false;
  const n = time / majorStep;
  return Math.abs(n - Math.round(n)) < 1e-6;
}

export function isMinorTick(time: number, minorStep: number) {
  if (minorStep <= 0) return false;
  const n = time / minorStep;
  return Math.abs(n - Math.round(n)) < 1e-6;
}
