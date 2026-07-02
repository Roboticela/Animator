import { useCallback, useRef } from "react";
import { TIMELINE_RULER_HEIGHT, pxToTime, timeToPx } from "@/lib/timeline-utils";
import { useAnimationStore } from "@/store/animationStore";

interface TimelineRulerProps {
  duration: number;
  contentWidth: number;
  pixelsPerSecond: number;
  fps: number;
  editable: boolean;
  onScrub: (time: number) => void;
}

export function TimelineRuler({ duration, contentWidth, pixelsPerSecond, fps, editable, onScrub }: TimelineRulerProps) {
  const currentTime = useAnimationStore((s) => s.currentTime);
  const playRangeStart = useAnimationStore((s) => s.playRangeStart);
  const playRangeEnd = useAnimationStore((s) => s.playRangeEnd);
  const setPlayRangeStart = useAnimationStore((s) => s.setPlayRangeStart);
  const setPlayRangeEnd = useAnimationStore((s) => s.setPlayRangeEnd);

  const rootRef = useRef<HTMLDivElement>(null);
  const safeDuration = duration > 0 ? duration : 1;
  const rangeEnd = playRangeEnd > 0 ? playRangeEnd : safeDuration;

  const timeFromClientX = useCallback(
    (clientX: number) => {
      const el = rootRef.current;
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      const x = clientX - rect.left;
      return Math.max(0, Math.min(pxToTime(x, pixelsPerSecond), safeDuration));
    },
    [pixelsPerSecond, safeDuration]
  );

  const scrub = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    onScrub(timeFromClientX(e.clientX));
  };

  const dragHandle = (which: "start" | "end") => (e: React.PointerEvent) => {
    e.stopPropagation();
    if (!editable) return;
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      const t = timeFromClientX(ev.clientX);
      if (which === "start") setPlayRangeStart(t);
      else setPlayRangeEnd(t);
    };
    const up = () => {
      el.releasePointerCapture(e.pointerId);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const majorStep = safeDuration <= 2 ? 0.25 : safeDuration <= 6 ? 0.5 : safeDuration <= 15 ? 1 : 2;
  const ticks: number[] = [];
  for (let t = 0; t <= safeDuration + 0.001; t += majorStep) ticks.push(Number(t.toFixed(4)));

  const playheadX = timeToPx(currentTime, pixelsPerSecond);
  const rangeLeft = timeToPx(playRangeStart, pixelsPerSecond);
  const rangeWidth = timeToPx(rangeEnd, pixelsPerSecond) - rangeLeft;

  return (
    <div
      ref={rootRef}
      className="relative cursor-crosshair select-none border-b border-border/40 bg-gradient-to-b from-background-subtle/90 to-background/40"
      style={{ height: TIMELINE_RULER_HEIGHT, width: contentWidth, minWidth: "100%" }}
      onPointerDown={scrub}
    >
      {ticks.map((t) => {
        const x = timeToPx(t, pixelsPerSecond);
        return (
          <div key={t} className="pointer-events-none absolute top-0 flex h-full flex-col" style={{ left: x }}>
            <div className="h-full w-px bg-border/50" />
            <span className="absolute bottom-0 left-1 font-mono text-[9px] text-foreground-muted/80">{t.toFixed(1)}</span>
          </div>
        );
      })}

      {Array.from({ length: Math.ceil(safeDuration * fps) + 1 }, (_, i) => i / fps).map((t) => {
        if (Math.abs((t / majorStep) % 1) < 0.01) return null;
        const x = timeToPx(t, pixelsPerSecond);
        return <div key={`f-${t}`} className="pointer-events-none absolute top-2 h-2 w-px bg-border/25" style={{ left: x }} />;
      })}

      <div
        className="pointer-events-none absolute inset-y-1 rounded-md border border-primary/25 bg-primary/10"
        style={{ left: rangeLeft, width: Math.max(rangeWidth, 4) }}
      />

      {editable && (
        <>
          <div
            className="absolute top-0 z-20 h-full w-2 -translate-x-1/2 cursor-ew-resize rounded-sm bg-primary/70 hover:bg-primary"
            style={{ left: rangeLeft }}
            title="Play range start"
            onPointerDown={dragHandle("start")}
          />
          <div
            className="absolute top-0 z-20 h-full w-2 -translate-x-1/2 cursor-ew-resize rounded-sm bg-primary/70 hover:bg-primary"
            style={{ left: rangeLeft + rangeWidth }}
            title="Play range end"
            onPointerDown={dragHandle("end")}
          />
        </>
      )}

      <div className="pointer-events-none absolute top-0 z-30 h-full" style={{ left: playheadX }}>
        <div className="absolute -top-0.5 left-1/2 h-0 w-0 -translate-x-1/2 border-x-[5px] border-t-[7px] border-x-transparent border-t-primary" />
        <div className="absolute top-0 h-full w-0.5 -translate-x-1/2 bg-primary shadow-[0_0_8px_var(--primary)]" />
      </div>
    </div>
  );
}
