import { useCallback, useEffect, useSyncExternalStore } from "react";

let maxActivePreviews = 3;
const active = new Set<string>();
const waiting = new Set<string>();
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function promoteWaiting() {
  for (const id of waiting) {
    if (active.size >= maxActivePreviews) break;
    waiting.delete(id);
    active.add(id);
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setPreviewSlotLimit(limit: number) {
  maxActivePreviews = Math.max(1, limit);
  promoteWaiting();
  notify();
}

export function resetPreviewSlots() {
  active.clear();
  waiting.clear();
  notify();
}

export type PreviewSlotStatus = "inactive" | "queued" | "active";

function getSlotStatus(id: string, wantsPreview: boolean): PreviewSlotStatus {
  if (!wantsPreview) return "inactive";
  if (active.has(id)) return "active";
  if (waiting.has(id)) return "queued";
  return "inactive";
}

/** Limits concurrent WebGL library previews — stricter when a heavy model is loaded. */
export function usePreviewSlotStatus(id: string, wantsPreview: boolean): PreviewSlotStatus {
  useSyncExternalStore(subscribe, () => active.size + waiting.size, () => 0);

  const release = useCallback(() => {
    if (active.delete(id) || waiting.delete(id)) {
      promoteWaiting();
      notify();
    }
  }, [id]);

  useEffect(() => {
    if (!wantsPreview) {
      release();
      return;
    }

    if (!active.has(id) && !waiting.has(id)) {
      if (active.size < maxActivePreviews) {
        active.add(id);
      } else {
        waiting.add(id);
      }
      notify();
    }
  }, [wantsPreview, id, release]);

  useEffect(() => () => release(), [id, release]);

  return getSlotStatus(id, wantsPreview);
}
