import { Trash2 } from "lucide-react";
import { TimelineKeyframe } from "@/components/timeline/TimelineKeyframe";
import { cn } from "@/lib/utils";
import type { KeyframeEasingId } from "@/lib/keyframe-easing";
import { TIMELINE_LABEL_WIDTH, TIMELINE_ROW_HEIGHT, timeToPx } from "@/lib/timeline-utils";

const SEGMENT_COLORS: Record<KeyframeEasingId, string> = {
  linear: "from-secondary/20 to-secondary/5",
  easeIn: "from-sky-500/30 to-sky-500/5",
  easeOut: "from-violet-500/30 to-violet-500/5",
  easeInOut: "from-indigo-500/30 to-indigo-500/5",
  hold: "from-amber-500/30 to-amber-500/5",
  easeInBack: "from-orange-500/30 to-orange-500/5",
  easeOutBack: "from-rose-500/30 to-rose-500/5",
  bounce: "from-emerald-500/30 to-emerald-500/5",
  elastic: "from-teal-500/30 to-teal-500/5",
};

interface TimelineTrackRowProps {
  boneName: string;
  times: number[];
  easings: Map<number, KeyframeEasingId>;
  duration: number;
  contentWidth: number;
  pixelsPerSecond: number;
  fps: number;
  isKeyframeSelected: (time: number) => boolean;
  onSelectKeyframe: (time: number, modifiers: { ctrl: boolean; shift: boolean }) => void;
  onMoveKeyframe: (oldTime: number, newTime: number) => void;
  onDeleteKeyframe: (time: number) => void;
}

export function TimelineTrackRow({
  times,
  easings,
  duration,
  contentWidth,
  pixelsPerSecond,
  fps,
  isKeyframeSelected,
  onSelectKeyframe,
  onMoveKeyframe,
  onDeleteKeyframe,
}: TimelineTrackRowProps) {
  const sorted = [...times].sort((a, b) => a - b);

  return (
    <div className="relative border-b border-border/30" style={{ height: TIMELINE_ROW_HEIGHT, width: contentWidth }}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/[0.02] to-transparent" />

      {sorted.map((t, i) => {
        const next = sorted[i + 1];
        if (next === undefined) return null;
        const left = timeToPx(t, pixelsPerSecond);
        const width = timeToPx(next, pixelsPerSecond) - left;
        const easing = easings.get(t) ?? "linear";
        return (
          <div
            key={`seg-${t}-${next}`}
            className={cn("pointer-events-none absolute inset-y-2 rounded-md bg-gradient-to-r opacity-80", SEGMENT_COLORS[easing])}
            style={{ left, width: Math.max(width, 2) }}
          />
        );
      })}

      {sorted.map((t) => (
        <TimelineKeyframe
          key={t}
          time={t}
          pixelsPerSecond={pixelsPerSecond}
          duration={duration}
          fps={fps}
          selected={isKeyframeSelected(t)}
          easing={easings.get(t) ?? "linear"}
          onSelect={(mod) => onSelectKeyframe(t, mod)}
          onCommitMove={(newTime) => onMoveKeyframe(t, newTime)}
          onDelete={() => onDeleteKeyframe(t)}
        />
      ))}
    </div>
  );
}

export function TimelineTrackLabel({
  boneName,
  isSelectedBone,
  onSelectBone,
  onRemoveTrack,
}: {
  boneName: string;
  isSelectedBone: boolean;
  onSelectBone: () => void;
  onRemoveTrack: () => void;
}) {
  return (
    <div
      className="group flex flex-shrink-0 items-center gap-1 border-b border-border/30 border-r border-border/40 bg-card/50 px-2"
      style={{ height: TIMELINE_ROW_HEIGHT, width: TIMELINE_LABEL_WIDTH }}
    >
      <button
        onClick={onSelectBone}
        title={boneName}
        className={cn(
          "min-w-0 flex-1 truncate text-left text-[11px] font-medium transition-colors hover:text-foreground",
          isSelectedBone ? "text-primary" : "text-foreground-muted"
        )}
      >
        {boneName}
      </button>
      <button
        onClick={onRemoveTrack}
        className="flex-shrink-0 rounded p-0.5 text-foreground-muted opacity-0 transition-opacity hover:bg-danger/10 hover:text-danger group-hover:opacity-100"
        title="Delete all keyframes on this bone"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}
