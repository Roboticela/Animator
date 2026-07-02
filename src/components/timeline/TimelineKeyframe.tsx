import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { KeyframeEasingId } from "@/lib/keyframe-easing";
import { KEYFRAME_EASING_COLORS } from "@/lib/keyframe-easing";
import { snapTime, timeToPx } from "@/lib/timeline-utils";

const DRAG_THRESHOLD_PX = 4;
const HIT_SIZE = 18;

interface TimelineKeyframeProps {
  time: number;
  pixelsPerSecond: number;
  duration: number;
  fps: number;
  selected: boolean;
  easing: KeyframeEasingId;
  snapToFrames: boolean;
  onSelect: (modifiers: { ctrl: boolean; shift: boolean }) => void;
  onCommitMove: (newTime: number) => void;
  onDelete: () => void;
}

export function TimelineKeyframe({
  time,
  pixelsPerSecond,
  duration,
  fps,
  selected,
  easing,
  snapToFrames,
  onSelect,
  onCommitMove,
  onDelete,
}: TimelineKeyframeProps) {
  const [dragTime, setDragTime] = useState(time);
  const [dragging, setDragging] = useState(false);
  const pointerRef = useRef<{ x: number; y: number; active: boolean } | null>(null);

  useEffect(() => {
    if (!dragging) setDragTime(time);
  }, [time, dragging]);

  const displayTime = dragging ? dragTime : time;
  const x = timeToPx(displayTime, pixelsPerSecond);

  const timeAtClientX = (clientX: number, track: HTMLElement) => {
    const rect = track.getBoundingClientRect();
    const localX = clientX - rect.left;
    const raw = Math.max(0, Math.min(localX / pixelsPerSecond, duration));
    return snapToFrames ? snapTime(raw, fps) : raw;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    onSelect({ ctrl: e.ctrlKey || e.metaKey, shift: e.shiftKey });
    pointerRef.current = { x: e.clientX, y: e.clientY, active: true };
    setDragging(false);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const ptr = pointerRef.current;
    if (!ptr?.active) return;
    const dx = e.clientX - ptr.x;
    const dy = e.clientY - ptr.y;
    if (!dragging && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
    if (!dragging) setDragging(true);
    const track = e.currentTarget.parentElement;
    if (!track) return;
    setDragTime(timeAtClientX(e.clientX, track));
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const ptr = pointerRef.current;
    pointerRef.current = null;
    e.stopPropagation();
    const track = e.currentTarget.parentElement;
    if (ptr?.active && dragging && track) {
      onCommitMove(timeAtClientX(e.clientX, track));
    }
    setDragging(false);
  };

  return (
    <div
      data-keyframe
      className="absolute top-1/2 z-30 -translate-x-1/2 -translate-y-1/2"
      style={{ left: x, width: HIT_SIZE, height: HIT_SIZE }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDelete();
      }}
      title={`${displayTime.toFixed(2)}s · ${easing} · drag to move · double-click delete`}
    >
      <div
        className={cn(
          "flex h-full w-full cursor-grab items-center justify-center active:cursor-grabbing",
          dragging && "cursor-grabbing"
        )}
      >
        <div
          className={cn(
            "h-3 w-3 rotate-45 border-2 transition-shadow",
            selected
              ? "border-primary bg-primary shadow-[0_0_0_2px_color-mix(in_srgb,var(--primary)_35%,transparent)]"
              : KEYFRAME_EASING_COLORS[easing],
            dragging && "scale-110 shadow-lg"
          )}
        />
      </div>
    </div>
  );
}
