import { useCallback, useMemo, useState, useEffect } from "react";
import { TIMELINE_RULER_HEIGHT, pxToTime, timeToPx } from "@/lib/timeline-utils";
import {
  formatTimelineLabel,
  getTimelineGridSteps,
  isMajorTick,
  ticksInRange,
  timelineGridBackground,
} from "@/lib/timeline-grid";

interface TimelineGridProps {
  duration: number;
  contentWidth: number;
  pixelsPerSecond: number;
  totalHeight: number;
  tracksTop: number;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onScrub: (time: number) => void;
}

export function TimelineGrid({
  duration,
  contentWidth,
  pixelsPerSecond,
  totalHeight,
  tracksTop,
  scrollRef,
  onScrub,
}: TimelineGridProps) {
  const safeDuration = duration > 0 ? duration : 1;
  const steps = useMemo(() => getTimelineGridSteps(pixelsPerSecond), [pixelsPerSecond]);
  const gridBg = useMemo(() => timelineGridBackground(steps, pixelsPerSecond), [steps, pixelsPerSecond]);

  const [visible, setVisible] = useState({ from: 0, to: safeDuration });

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      const pad = 48 / pixelsPerSecond;
      const from = Math.max(0, pxToTime(el.scrollLeft, pixelsPerSecond) - pad);
      const to = Math.min(safeDuration, pxToTime(el.scrollLeft + el.clientWidth, pixelsPerSecond) + pad);
      setVisible({ from, to });
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [pixelsPerSecond, safeDuration, scrollRef]);

  const majorTicks = useMemo(
    () => ticksInRange(visible.from, visible.to, steps.major, safeDuration),
    [visible.from, visible.to, steps.major, safeDuration]
  );

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

  const scrub = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
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

  const labelMinPx = steps.major * pixelsPerSecond;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[5]"
      style={{ width: contentWidth, height: totalHeight }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: gridBg,
          backgroundPosition: "0 0",
        }}
      />

      <div
        className="pointer-events-auto absolute left-0 top-0 z-10 cursor-crosshair select-none border-b border-border/30 bg-background-subtle/40"
        style={{ width: contentWidth, height: TIMELINE_RULER_HEIGHT }}
        onPointerDown={scrub}
      />

      {majorTicks.map((t) => {
        const x = timeToPx(t, pixelsPerSecond);
        const showLabel = labelMinPx >= 36;
        return (
          <div key={`maj-${t}`} className="pointer-events-none absolute top-0" style={{ left: x, height: totalHeight }}>
            <div className="absolute top-0 w-px bg-foreground/25" style={{ height: TIMELINE_RULER_HEIGHT }} />
            <div
              className="absolute w-px bg-foreground/10"
              style={{ top: tracksTop, height: totalHeight - tracksTop }}
            />
            {showLabel && (
              <span className="absolute bottom-0.5 left-1 whitespace-nowrap font-mono text-[9px] font-medium text-foreground-muted/90">
                {formatTimelineLabel(t, steps.major)}
              </span>
            )}
          </div>
        );
      })}

      {steps.minor < steps.major &&
        ticksInRange(visible.from, visible.to, steps.minor, safeDuration)
          .filter((t) => !isMajorTick(t, steps.major))
          .map((t) => (
            <div
              key={`min-${t}`}
              className="pointer-events-none absolute top-0 w-px bg-foreground/18"
              style={{ left: timeToPx(t, pixelsPerSecond), height: TIMELINE_RULER_HEIGHT }}
            />
          ))}
    </div>
  );
}
