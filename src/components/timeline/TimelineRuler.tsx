interface TimelineRulerProps {
  duration: number;
  currentTime: number;
  onScrub: (time: number) => void;
}

export function TimelineRuler({ duration, currentTime, onScrub }: TimelineRulerProps) {
  const scrubFromEvent = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    onScrub(pct * duration);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    scrubFromEvent(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return;
    scrubFromEvent(e);
  };

  const safeDuration = duration > 0 ? duration : 1;
  const tickCount = Math.max(2, Math.min(20, Math.round(safeDuration * 2)));
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => (i / tickCount) * safeDuration);
  const pct = (currentTime / safeDuration) * 100;

  return (
    <div
      className="relative ml-[8.5rem] h-6 flex-1 cursor-pointer select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
    >
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
      {ticks.map((t, i) => (
        <div key={i} className="absolute top-0.5 flex -translate-x-1/2 flex-col items-center" style={{ left: `${(t / safeDuration) * 100}%` }}>
          <div className="h-1.5 w-px bg-border" />
          <span className="mt-0.5 font-mono text-[9px] text-foreground-muted">{t.toFixed(1)}</span>
        </div>
      ))}
      <div className="pointer-events-none absolute top-0 z-20 h-full w-px bg-primary" style={{ left: `${pct}%` }}>
        <div className="absolute -left-1.5 -top-0.5 h-2.5 w-2.5 rotate-45 bg-primary" />
      </div>
    </div>
  );
}
