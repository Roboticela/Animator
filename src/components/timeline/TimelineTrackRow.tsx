import { X } from "lucide-react";
import { KeyframeDiamond } from "@/components/timeline/KeyframeDiamond";
import { cn } from "@/lib/utils";

interface TimelineTrackRowProps {
  boneName: string;
  times: number[];
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
  duration,
  selectedTime,
  isSelectedBone,
  onSelectKeyframe,
  onMoveKeyframe,
  onDeleteKeyframe,
  onSelectBone,
  onRemoveTrack,
}: TimelineTrackRowProps) {
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
        {times.map((t) => (
          <KeyframeDiamond
            key={t}
            time={t}
            duration={duration}
            selected={selectedTime === t}
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
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
