/** Exponential timeline zoom — no upper cap, only a small floor. */
export const TIMELINE_ZOOM_MIN = 2;
export const TIMELINE_ZOOM_DEFAULT = 80;
export const TIMELINE_ZOOM_FACTOR = 1.22;

export function clampTimelineZoom(pixelsPerSecond: number) {
  return Math.max(TIMELINE_ZOOM_MIN, pixelsPerSecond);
}

export function zoomTimelineByFactor(current: number, factor: number) {
  return clampTimelineZoom(current * factor);
}

export function zoomTimelineIn(current: number) {
  return zoomTimelineByFactor(current, TIMELINE_ZOOM_FACTOR);
}

export function zoomTimelineOut(current: number) {
  return zoomTimelineByFactor(current, 1 / TIMELINE_ZOOM_FACTOR);
}

/** Fit entire clip into the visible timeline width (with padding). */
export function fitTimelineZoom(duration: number, viewWidth: number, padding = 48) {
  if (duration <= 0 || viewWidth <= padding) return TIMELINE_ZOOM_DEFAULT;
  return clampTimelineZoom((viewWidth - padding) / duration);
}

export function formatZoomLabel(pixelsPerSecond: number) {
  if (pixelsPerSecond >= 1000) return `${(pixelsPerSecond / 1000).toFixed(1)}k`;
  if (pixelsPerSecond >= 100) return `${Math.round(pixelsPerSecond)}`;
  return `${Math.round(pixelsPerSecond * 10) / 10}`;
}
