export const TIMELINE_LABEL_WIDTH = 148;
export const TIMELINE_ROW_HEIGHT = 32;
export const TIMELINE_RULER_HEIGHT = 32;
export const TIMELINE_MIN_ZOOM = 24;
export const TIMELINE_MAX_ZOOM = 240;
export const TIMELINE_DEFAULT_ZOOM = 80;

export interface TimelineKeyframeRef {
  bone: string;
  time: number;
}

export function timeKey(time: number) {
  return Number(time.toFixed(4));
}

export function keyframeId(ref: TimelineKeyframeRef) {
  return `${ref.bone}|${timeKey(ref.time)}`;
}

export function parseKeyframeId(id: string): TimelineKeyframeRef | null {
  const sep = id.indexOf("|");
  if (sep === -1) return null;
  const bone = id.slice(0, sep);
  const time = Number(id.slice(sep + 1));
  if (!bone || Number.isNaN(time)) return null;
  return { bone, time };
}

export function timeToPx(time: number, pixelsPerSecond: number) {
  return time * pixelsPerSecond;
}

export function pxToTime(px: number, pixelsPerSecond: number) {
  return Math.max(0, px / pixelsPerSecond);
}

export function clampTime(time: number, duration: number) {
  return Math.max(0, Math.min(time, duration));
}

export function formatTimecode(seconds: number, fps = 30) {
  const frame = Math.round(seconds * fps);
  const f = frame % fps;
  const totalSec = Math.floor(frame / fps);
  const s = totalSec % 60;
  const m = Math.floor(totalSec / 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}:${String(f).padStart(2, "0")}`;
}

export function formatTimeShort(seconds: number) {
  return `${seconds.toFixed(2)}s`;
}

export function snapTime(time: number, fps: number) {
  const step = 1 / fps;
  return Math.round(time / step) * step;
}
