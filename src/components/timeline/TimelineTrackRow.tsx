import { Trash2 } from "lucide-react";
import { KeyframeDiamond } from "@/components/timeline/KeyframeDiamond";
import { cn } from "@/lib/utils";
import type { KeyframeEasingId } from "@/lib/keyframe-easing";

const SEGMENT_COLORS: Record<KeyframeEasingId, string> = {
  linear: "bg-secondary/30",
  easeIn: "bg-sky-500/25",
  easeOut: "bg-violet-500/25",
  easeInOut: "bg-indigo-500/25",
  hold: "bg-amber-500/25",
  easeInBack: "bg-orange-500/25",
  easeOutBack: "bg-rose-500/25",
  bounce: "bg-emerald-500/25",
  elastic: "bg-teal-500/25",
};

interface TimelineTrackRowProps {
  boneName: string;
  times: number[];
  easings: Map<number, KeyframeEasingId>;
  duration: number;
  selectedTime: number | null;
  isSelectedBone: boolean;
  onSelectKeyframe: (time: number) => void;
  onMoveKeyframe: (oldTime: number, newTime: number) => void;
  onDeleteKeyframe: (time: number) => void;
  onSelectBone: () => void;
  onRemoveTrack: () => void;
}

export function TimelineTrackRow({
  boneName,
  times,
  easings,
  duration,
  selectedTime,
  isSelectedBone,
  onSelectKeyframe,
  onMoveKeyframe,
  onDeleteKeyframe,
  onSelectBone,
  onRemoveTrack,
}: TimelineTrackRowProps) {
  const sorted = [...times].sort((a, b) => a - b);

  return (
    <div className="flex h-8 flex-shrink-0 items-center gap-2">
      <button
        onClick={onSelectBone}
        title={boneName}
        className={cn(
          "w-32 flex-shrink-0 truncate rounded px-1.5 text-left text-[11px] font-medium hover:text-foreground",
          isSelectedBone ? "text-primary" : "text-foreground-muted"
        )}
      >
        {boneName}
      </button>
      <div className="relative h-5 flex-1 rounded-full bg-background-subtle">
        {sorted.map((t, i) => {
          const next = sorted[i + 1];
          if (next === undefined) return null;
          const left = duration > 0 ? (t / duration) * 100 : 0;
          const width = duration > 0 ? ((next - t) / duration) * 100 : 0;
          const easing = easings.get(t) ?? "linear";
          return (
            <div
              key={`seg-${t}-${next}`}
              className={cn("pointer-events-none absolute top-1/2 h-1 -translate-y-1/2 rounded-full", SEGMENT_COLORS[easing])}
              style={{ left: `${left}%`, width: `${width}%` }}
              title={`${easing} → next keyframe`}
            />
          );
        })}
        {sorted.map((t) => (
          <KeyframeDiamond
            key={t}
            time={t}
            duration={duration}
            selected={selectedTime === t}
            easing={easings.get(t) ?? "linear"}
            onSelect={() => onSelectKeyframe(t)}
            onCommitMove={(newTime) => onMoveKeyframe(t, newTime)}
            onDelete={() => onDeleteKeyframe(t)}
          />
        ))}
      </div>
      <button
        onClick={onRemoveTrack}
        className="flex-shrink-0 text-foreground-muted hover:text-danger"
        title="Remove all keyframes for this bone"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}
