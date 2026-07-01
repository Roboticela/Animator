import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface KeyframeDiamondProps {
  time: number;
  duration: number;
  selected: boolean;
  onSelect: () => void;
  onCommitMove: (newTime: number) => void;
  onDelete: () => void;
}

export function KeyframeDiamond({ time, duration, selected, onSelect, onCommitMove, onDelete }: KeyframeDiamondProps) {
  const [dragTime, setDragTime] = useState(time);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!dragging) setDragTime(time);
  }, [time, dragging]);

  const displayTime = dragging ? dragTime : time;
  const pct = duration > 0 ? Math.min(1, Math.max(0, displayTime / duration)) : 0;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onSelect();
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const track = e.currentTarget.parentElement;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const nextPct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    setDragTime(nextPct * duration);
  };

  const handlePointerUp = () => {
    if (!dragging) return;
    setDragging(false);
    onCommitMove(dragTime);
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDelete();
      }}
      title={`t = ${displayTime.toFixed(2)}s — drag to move, double-click to delete`}
      style={{ left: `${pct * 100}%` }}
      className={cn(
        "absolute top-1/2 z-10 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 cursor-ew-resize border transition-colors",
        selected ? "border-primary bg-primary" : "border-secondary bg-secondary/90 hover:bg-secondary"
      )}
    />
  );
}
