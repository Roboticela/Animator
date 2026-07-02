import { useCallback } from "react";
import { pxToTime, timeToPx } from "@/lib/timeline-utils";

interface TimelinePlayheadProps {
  time: number;
  duration: number;
  pixelsPerSecond: number;
  height: number;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onScrub: (time: number) => void;
}

export function TimelinePlayhead({
  time,
  duration,
  pixelsPerSecond,
  height,
  scrollRef,
  onScrub,
}: TimelinePlayheadProps) {
  const x = timeToPx(time, pixelsPerSecond);
  const safeDuration = duration > 0 ? duration : 1;

  const timeFromClientX = useCallback(
    (clientX: number) => {
      const scrollEl = scrollRef.current;
      if (!scrollEl) return 0;
      const rect = scrollEl.getBoundingClientRect();
      const contentX = clientX - rect.left + scrollEl.scrollLeft;
      return Math.max(0, Math.min(pxToTime(contentX, pixelsPerSecond), safeDuration));
    },
    [pixelsPerSecond, safeDuration, scrollRef]
  );

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    onScrub(timeFromClientX(e.clientX));
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => onScrub(timeFromClientX(ev.clientX));
    const up = () => {
      el.releasePointerCapture(e.pointerId);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div
      className="absolute top-0 z-40 touch-none"
      style={{ left: x, height, width: 0 }}
      aria-hidden
    >
      <div
        className="absolute -translate-x-1/2 cursor-ew-resize"
        style={{ top: 0, height, width: 14 }}
        title={`Playhead ${time.toFixed(2)}s — drag to scrub`}
        onPointerDown={onPointerDown}
      >
        <div className="pointer-events-none absolute -top-0.5 left-1/2 h-0 w-0 -translate-x-1/2 border-x-[6px] border-t-[8px] border-x-transparent border-t-primary drop-shadow-sm" />
        <div className="pointer-events-none absolute top-0 left-1/2 h-full w-0.5 -translate-x-1/2 bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.55)]" />
      </div>
    </div>
  );
}
