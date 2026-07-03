import { cn } from "@/lib/utils";

type ResizeAxis = "horizontal" | "vertical";

interface ResizeHandleProps {
  axis: ResizeAxis;
  onDrag: (delta: number) => void;
  className?: string;
}

export function ResizeHandle({ axis, onDrag, className }: ResizeHandleProps) {
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    let last = axis === "horizontal" ? e.clientX : e.clientY;

    const finish = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    };

    const move = (ev: PointerEvent) => {
      const current = axis === "horizontal" ? ev.clientX : ev.clientY;
      const delta = current - last;
      if (delta !== 0) onDrag(delta);
      last = current;
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
  };

  const isCol = axis === "horizontal";

  return (
    <div
      role="separator"
      aria-orientation={isCol ? "vertical" : "horizontal"}
      title={isCol ? "Drag to resize panels" : "Drag to resize timeline"}
      className={cn(
        "group relative z-30 flex-shrink-0 touch-none select-none bg-transparent transition-colors",
        isCol
          ? "flex w-2.5 cursor-col-resize items-center justify-center hover:bg-primary/10 active:bg-primary/15"
          : "flex h-2.5 cursor-row-resize items-center justify-center hover:bg-primary/10 active:bg-primary/15",
        className
      )}
      onPointerDown={onPointerDown}
    >
      <div
        className={cn(
          "rounded-full bg-border transition-colors group-hover:bg-primary/45 group-active:bg-primary/60",
          isCol ? "h-10 w-0.5" : "h-0.5 w-10"
        )}
      />
    </div>
  );
}
