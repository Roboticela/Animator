import { useCallback, useEffect, useRef, useState } from "react";
import { ClipboardPaste, Copy, Minus, Plus } from "lucide-react";
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
  showSteppers?: boolean;
  showClipboard?: boolean;
}

function stepMultiplier(event: { shiftKey?: boolean; altKey?: boolean }) {
  if (event.shiftKey) return 10;
  if (event.altKey) return 0.1;
  return 1;
}

const clipBtnClass =
  "flex h-8 w-6 flex-shrink-0 items-center justify-center rounded-md border border-border/60 bg-background-subtle/80 text-foreground-muted transition-colors hover:bg-accent hover:text-foreground active:bg-primary/15 active:text-primary";

interface DragState {
  startX: number;
  startValue: number;
  dragging: boolean;
  lastValue: number;
}

/** Numeric field with mouse scrub, − / + steppers, and optional copy / paste. */
export function NumberInput({
  label,
  value,
  onChange,
  onCommit,
  step = 0.01,
  precision = 3,
  className,
  accent,
  showSteppers = true,
  showClipboard = false,
}: NumberInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const [text, setText] = useState(value.toFixed(precision));
  const [editing, setEditing] = useState(false);
  const [scrubbing, setScrubbing] = useState(false);
  const [copied, setCopied] = useState(false);
  const dragRef = useRef<DragState | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const repeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localValueRef = useRef(value);

  useEffect(() => {
    localValueRef.current = localValue;
  }, [localValue]);

  // Sync from parent when idle — not while scrubbing or typing.
  useEffect(() => {
    if (editing || scrubbing) return;
    setLocalValue(value);
    setText(value.toFixed(precision));
  }, [value, precision, editing, scrubbing]);

  const stopRepeat = useCallback(() => {
    if (repeatRef.current) {
      clearInterval(repeatRef.current);
      repeatRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopRepeat();
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    };
  }, [stopRepeat]);

  const commitValue = useCallback(
    (next: number, notifyCommit = false) => {
      const rounded = Number(next.toFixed(precision + 2));
      const formatted = rounded.toFixed(precision);
      localValueRef.current = rounded;
      setLocalValue(rounded);
      setText(formatted);
      onChange(rounded);
      if (notifyCommit) onCommit?.(rounded);
    },
    [onChange, onCommit, precision]
  );

  const currentNumeric = useCallback(() => {
    if (editing) {
      const parsed = Number(text);
      if (!Number.isNaN(parsed)) return parsed;
    }
    return localValueRef.current;
  }, [editing, text]);

  const applyDelta = useCallback(
    (delta: number) => {
      commitValue(currentNumeric() + delta);
    },
    [commitValue, currentNumeric]
  );

  const copyValue = async () => {
    const raw = localValueRef.current.toFixed(precision);
    try {
      await navigator.clipboard.writeText(raw);
      setCopied(true);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 900);
    } catch {
      /* ignore */
    }
  };

  const pasteValue = async () => {
    try {
      const raw = (await navigator.clipboard.readText()).trim();
      const parsed = Number(raw);
      if (Number.isNaN(parsed)) return;
      commitValue(parsed, true);
    } catch {
      /* ignore */
    }
  };

  const endScrub = useCallback(
    (commit: boolean, lastValue?: number) => {
      dragRef.current = null;
      setScrubbing(false);
      if (commit && lastValue != null) onCommit?.(lastValue);
    },
    [onCommit]
  );

  const onScrubPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (editing || e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const start = localValueRef.current;
    dragRef.current = {
      startX: e.clientX,
      startValue: start,
      dragging: false,
      lastValue: start,
    };
  };

  const onScrubPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || editing) return;
    const dx = e.clientX - drag.startX;
    if (!drag.dragging && Math.abs(dx) > 2) {
      drag.dragging = true;
      setScrubbing(true);
    }
    if (!drag.dragging) return;
    const mult = stepMultiplier(e);
    const next = Number((drag.startValue + dx * step * mult).toFixed(precision + 2));
    drag.lastValue = next;
    commitValue(next);
  };

  const onScrubPointerUp = (e: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const { dragging, lastValue } = drag;
    endScrub(dragging, lastValue);
    if (!dragging && e.currentTarget === inputRef.current) {
      const display = lastValue.toFixed(precision);
      setText(display);
      setEditing(true);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  };

  const commitText = () => {
    const parsed = Number(text);
    if (!Number.isNaN(parsed)) {
      commitValue(parsed, true);
    } else {
      const fallback = localValueRef.current.toFixed(precision);
      setText(fallback);
      commitValue(localValueRef.current, true);
    }
    setEditing(false);
  };

  const startRepeat = (direction: -1 | 1, event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const mult = stepMultiplier(event);
    applyDelta(direction * step * mult);
    stopRepeat();
    repeatRef.current = setInterval(() => applyDelta(direction * step * mult), 80);
  };

  const stepBtnClass =
    "flex h-full w-6 flex-shrink-0 items-center justify-center text-foreground-muted transition-colors hover:bg-accent hover:text-foreground active:bg-primary/15 active:text-primary disabled:pointer-events-none disabled:opacity-40";

  const scrubHandlers = {
    onPointerDown: onScrubPointerDown,
    onPointerMove: onScrubPointerMove,
    onPointerUp: onScrubPointerUp,
    onPointerCancel: (e: React.PointerEvent<HTMLElement>) => {
      const drag = dragRef.current;
      endScrub(Boolean(drag?.dragging), drag?.lastValue);
      e.currentTarget.releasePointerCapture(e.pointerId);
    },
  };

  const display = editing ? text : localValue.toFixed(precision);

  const field = (
    <div
      className={cn(
        "flex h-8 min-w-0 flex-1 select-none items-center overflow-hidden rounded-lg border border-border/80 bg-background-subtle/80 text-xs shadow-sm",
        scrubbing && "ring-1 ring-primary/35",
        className
      )}
    >
      {showSteppers && (
        <button
          type="button"
          tabIndex={-1}
          className={cn(stepBtnClass, "border-r border-border/60")}
          onPointerDown={(e) => startRepeat(-1, e)}
          onPointerUp={stopRepeat}
          onPointerLeave={stopRepeat}
          onPointerCancel={stopRepeat}
          aria-label="Decrease"
        >
          <Minus className="h-3 w-3" strokeWidth={2.5} />
        </button>
      )}

      {label && (
        <span
          {...scrubHandlers}
          className={cn(
            "flex h-full w-5 flex-shrink-0 cursor-ew-resize items-center justify-center border-r border-border/60 font-mono text-[10px] font-bold touch-none",
            scrubbing && "bg-primary/10"
          )}
          style={{ color: accent ?? "var(--foreground-muted)" }}
          title="Drag to adjust"
        >
          {label}
        </span>
      )}

      <input
        ref={inputRef}
        value={display}
        readOnly={!editing}
        onFocus={() => {
          if (scrubbing) return;
          if (!editing) {
            setText(localValueRef.current.toFixed(precision));
            setEditing(true);
          }
        }}
        onChange={(e) => setText(e.target.value)}
        onBlur={commitText}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") {
            setText(localValueRef.current.toFixed(precision));
            setEditing(false);
            (e.target as HTMLInputElement).blur();
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            applyDelta(step * stepMultiplier(e));
          }
          if (e.key === "ArrowDown") {
            e.preventDefault();
            applyDelta(-step * stepMultiplier(e));
          }
        }}
        {...(editing ? {} : scrubHandlers)}
        className={cn(
          "h-full min-w-0 flex-1 bg-transparent px-1.5 text-center font-mono text-[11px] tabular-nums outline-none touch-none",
          editing ? "cursor-text" : "cursor-ew-resize"
        )}
        title={editing ? undefined : "Drag to adjust · click to type"}
      />

      {showSteppers && (
        <button
          type="button"
          tabIndex={-1}
          className={cn(stepBtnClass, "border-l border-border/60")}
          onPointerDown={(e) => startRepeat(1, e)}
          onPointerUp={stopRepeat}
          onPointerLeave={stopRepeat}
          onPointerCancel={stopRepeat}
          aria-label="Increase"
        >
          <Plus className="h-3 w-3" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );

  if (!showClipboard) return field;

  return (
    <div className="flex min-w-0 items-center gap-0.5">
      <button
        type="button"
        className={cn(clipBtnClass, copied && "border-primary/40 bg-primary/10 text-primary")}
        title={copied ? "Copied!" : `Copy ${label ?? "value"}`}
        onClick={copyValue}
        aria-label={`Copy ${label ?? "value"}`}
      >
        <Copy className="h-3 w-3" />
      </button>
      {field}
      <button
        type="button"
        className={clipBtnClass}
        title={`Paste into ${label ?? "value"}`}
        onClick={pasteValue}
        aria-label={`Paste into ${label ?? "value"}`}
      >
        <ClipboardPaste className="h-3 w-3" />
      </button>
    </div>
  );
}
