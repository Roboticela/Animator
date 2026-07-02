import { useCallback } from "react";
import { timeToPx } from "@/lib/timeline-utils";
import { useAnimationStore } from "@/store/animationStore";

interface TimelinePlayRangeProps {
  duration: number;
  pixelsPerSecond: number;
  height: number;
  editable: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

export function TimelinePlayRange({
  duration,
  pixelsPerSecond,
  height,
  editable,
  scrollRef,
}: TimelinePlayRangeProps) {
  const playRangeStart = useAnimationStore((s) => s.playRangeStart);
  const playRangeEnd = useAnimationStore((s) => s.playRangeEnd);
  const setPlayRangeStart = useAnimationStore((s) => s.setPlayRangeStart);
  const setPlayRangeEnd = useAnimationStore((s) => s.setPlayRangeEnd);

  const safeDuration = duration > 0 ? duration : 1;
  const rangeEnd = playRangeEnd > 0 ? playRangeEnd : safeDuration;

  const timeFromClientX = useCallback(
    (clientX: number) => {
      const scrollEl = scrollRef.current;
      if (!scrollEl) return 0;
      const rect = scrollEl.getBoundingClientRect();
      const contentX = clientX - rect.left + scrollEl.scrollLeft;
      return Math.max(0, Math.min(contentX / pixelsPerSecond, safeDuration));
    },
    [pixelsPerSecond, safeDuration, scrollRef]
  );

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

  const rangeLeft = timeToPx(playRangeStart, pixelsPerSecond);
  const rangeWidth = timeToPx(rangeEnd, pixelsPerSecond) - rangeLeft;

  return (
    <>
      <div
        className="pointer-events-none absolute top-0 z-10 border-x border-primary/25 bg-primary/6"
        style={{ left: rangeLeft, width: Math.max(rangeWidth, 4), height }}
      />
      {editable && (
        <>
          <div
            className="absolute top-0 z-20 h-full w-2 -translate-x-1/2 cursor-ew-resize rounded-full bg-primary/80 hover:bg-primary"
            style={{ left: rangeLeft, height }}
            title="Play range start"
            onPointerDown={dragHandle("start")}
          />
          <div
            className="absolute top-0 z-20 h-full w-2 -translate-x-1/2 cursor-ew-resize rounded-full bg-primary/80 hover:bg-primary"
            style={{ left: rangeLeft + rangeWidth, height }}
            title="Play range end"
            onPointerDown={dragHandle("end")}
          />
        </>
      )}
    </>
  );
}
