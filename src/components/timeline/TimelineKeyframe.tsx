import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { KeyframeEasingId } from "@/lib/keyframe-easing";
import { KEYFRAME_EASING_COLORS } from "@/lib/keyframe-easing";
import { snapTime, timeToPx } from "@/lib/timeline-utils";

interface TimelineKeyframeProps {
  time: number;
  pixelsPerSecond: number;
  duration: number;
  fps: number;
  selected: boolean;
  easing: KeyframeEasingId;
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
  onSelect,
  onCommitMove,
  onDelete,
}: TimelineKeyframeProps) {
  const [dragTime, setDragTime] = useState(time);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!dragging) setDragTime(time);
  }, [time, dragging]);

  const displayTime = dragging ? dragTime : time;
  const x = timeToPx(displayTime, pixelsPerSecond);

  return (
    <div
      data-keyframe
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect({ ctrl: e.ctrlKey || e.metaKey, shift: e.shiftKey });
        setDragging(true);
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!dragging) return;
        const track = e.currentTarget.parentElement;
        if (!track) return;
        const rect = track.getBoundingClientRect();
        const localX = e.clientX - rect.left;
        const t = snapTime(Math.max(0, Math.min(localX / pixelsPerSecond, duration)), fps);
        setDragTime(t);
      }}
      onPointerUp={() => {
        if (!dragging) return;
        setDragging(false);
        onCommitMove(dragTime);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDelete();
      }}
      title={`${displayTime.toFixed(2)}s · ${easing} · drag to move · double-click delete`}
      style={{ left: x }}
      className={cn(
        "absolute top-1/2 z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 cursor-grab border-2 transition-shadow active:cursor-grabbing",
        selected
          ? "z-20 border-primary bg-primary shadow-[0_0_0_2px_color-mix(in_srgb,var(--primary)_35%,transparent)]"
          : KEYFRAME_EASING_COLORS[easing],
        dragging && "scale-110 shadow-lg"
      )}
    />
  );
}
