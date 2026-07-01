import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface NumberInputProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  onCommit?: (value: number) => void;
  step?: number;
  precision?: number;
  className?: string;
  accent?: string;
}

/** Numeric field that supports click-drag scrubbing (left/right) like most 3D DCC tools. */
export function NumberInput({
  label,
  value,
  onChange,
  onCommit,
  step = 0.01,
  precision = 3,
  className,
  accent,
}: NumberInputProps) {
  const [text, setText] = useState(value.toFixed(precision));
  const [editing, setEditing] = useState(false);
  const dragRef = useRef<{ startX: number; startValue: number; dragging: boolean } | null>(null);

  useEffect(() => {
    if (!editing) setText(value.toFixed(precision));
  }, [value, precision, editing]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (editing) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startValue: value, dragging: false };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    if (Math.abs(dx) > 2) dragRef.current.dragging = true;
    if (!dragRef.current.dragging) return;
    const next = dragRef.current.startValue + dx * step;
    onChange(Number(next.toFixed(precision + 2)));
  };

  const handlePointerUp = () => {
    if (dragRef.current?.dragging) onCommit?.(value);
    dragRef.current = null;
  };

  const commitText = () => {
    const parsed = Number(text);
    if (!Number.isNaN(parsed)) {
      onChange(parsed);
      onCommit?.(parsed);
    } else {
      setText(value.toFixed(precision));
    }
    setEditing(false);
  };

  return (
    <div
      className={cn(
        "flex h-7 select-none items-center overflow-hidden rounded-md border border-border bg-background-subtle text-xs",
        "cursor-ew-resize",
        className
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {label && (
        <span
          className="flex h-full w-5 flex-shrink-0 items-center justify-center border-r border-border/70 font-mono text-[10px] font-bold"
          style={{ color: accent ?? "var(--foreground-muted)" }}
        >
          {label}
        </span>
      )}
      <input
        value={editing ? text : value.toFixed(precision)}
        onFocus={() => setEditing(true)}
        onChange={(e) => setText(e.target.value)}
        onBlur={commitText}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") {
            setText(value.toFixed(precision));
            setEditing(false);
            (e.target as HTMLInputElement).blur();
          }
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className="h-full w-full min-w-0 flex-1 cursor-text bg-transparent px-1.5 text-right font-mono outline-none"
      />
    </div>
  );
}
