import { Trash2 } from "lucide-react";
import { TimelineKeyframe } from "@/components/timeline/TimelineKeyframe";
import { cn } from "@/lib/utils";
import { KEYFRAME_SEGMENT_GRADIENTS, type KeyframeEasingId } from "@/lib/keyframe-easing";
import { TIMELINE_LABEL_WIDTH, TIMELINE_ROW_HEIGHT, timeToPx } from "@/lib/timeline-utils";

interface TimelineTrackRowProps {
  boneName: string;
  isAlternate?: boolean;
  times: number[];
  easings: Map<number, KeyframeEasingId>;
  duration: number;
  contentWidth: number;
  pixelsPerSecond: number;
  fps: number;
  snapToFrames: boolean;
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
  snapToFrames,
  isAlternate,
  isKeyframeSelected,
  onSelectKeyframe,
  onMoveKeyframe,
  onDeleteKeyframe,
}: TimelineTrackRowProps) {
  const sorted = [...times].sort((a, b) => a - b);

  return (
    <div
      className={cn(
        "relative border-b border-border/25",
        isAlternate ? "bg-foreground/[0.02]" : "bg-transparent"
      )}
      style={{ height: TIMELINE_ROW_HEIGHT, width: contentWidth }}
    >
      {sorted.map((t, i) => {
        const next = sorted[i + 1];
        if (next === undefined) return null;
        const left = timeToPx(t, pixelsPerSecond);
        const width = timeToPx(next, pixelsPerSecond) - left;
        const easing = easings.get(t) ?? "linear";
        return (
          <div
            key={`seg-${t}-${next}`}
            className={cn("pointer-events-none absolute inset-y-2 rounded-md bg-gradient-to-r opacity-80", KEYFRAME_SEGMENT_GRADIENTS[easing])}
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
          snapToFrames={snapToFrames}
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
  isAlternate,
  onSelectBone,
  onRemoveTrack,
}: {
  boneName: string;
  isSelectedBone: boolean;
  isAlternate?: boolean;
  onSelectBone: () => void;
  onRemoveTrack: () => void;
}) {
  return (
    <div
      className={cn(
        "group flex flex-shrink-0 items-center gap-1 border-b border-border/25 px-2",
        isAlternate ? "bg-foreground/[0.02]" : "bg-transparent"
      )}
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
