import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  CornerDownLeft,
  CornerDownRight,
  FilePenLine,
  Focus,
  Minus,
  Moon,
  Pause,
  Play,
  Plus,
  Redo2,
  Repeat,
  Scan,
  SkipBack,
  Sparkles,
  Sun,
  Trash2,
  Undo2,
  Waves,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { FeedbackButton } from "@/components/ui/FeedbackButton";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { formatTimeShort, formatTimecode } from "@/lib/timeline-utils";
import type { KeyframeEasingId } from "@/lib/keyframe-easing";
import { KEYFRAME_EASINGS } from "@/lib/keyframe-easing";
import { setBoneKeyframeEasing, setEasingForAllBonesAtTime } from "@/lib/app-actions";
import { useAnimationStore } from "@/store/animationStore";

const SPEEDS = [0.25, 0.5, 1, 1.5, 2];

const KEYFRAME_EASING_ICONS: Record<KeyframeEasingId, LucideIcon> = {
  linear: Minus,
  easeIn: Sun,
  easeOut: Moon,
  easeInOut: ArrowLeftRight,
  hold: Pause,
  easeInBack: CornerDownLeft,
  easeOutBack: CornerDownRight,
  bounce: CircleDot,
  elastic: Waves,
};

interface TimelineToolbarProps {
  clipName: string;
  isEditable: boolean;
  fps: number;
  selectedKeyframe: { bone: string; time: number } | null;
  currentEasing: KeyframeEasingId;
  selectionCount: number;
  onEditAsCustom?: () => void;
  onSetDuration?: (duration: number) => void;
  onDeleteSelection?: () => void;
  onClearSelection?: () => void;
}

export function TimelineToolbar({
  clipName,
  isEditable,
  fps,
  selectedKeyframe,
  currentEasing,
  selectionCount,
  onEditAsCustom,
  onSetDuration,
  onDeleteSelection,
  onClearSelection,
}: TimelineToolbarProps) {
  const [applyToAll, setApplyToAll] = useState(false);

  const isPlaying = useAnimationStore((s) => s.isPlaying);
  const loop = useAnimationStore((s) => s.loop);
  const loopInRange = useAnimationStore((s) => s.loopInRange);
  const speed = useAnimationStore((s) => s.speed);
  const currentTime = useAnimationStore((s) => s.currentTime);
  const duration = useAnimationStore((s) => s.duration);
  const playRangeStart = useAnimationStore((s) => s.playRangeStart);
  const playRangeEnd = useAnimationStore((s) => s.playRangeEnd);
  const timelineZoom = useAnimationStore((s) => s.timelineZoom);
  const activeClipId = useAnimationStore((s) => s.activeClipId);
  const undoStack = useAnimationStore((s) => s.undoStack);
  const redoStack = useAnimationStore((s) => s.redoStack);

  const togglePlay = useAnimationStore((s) => s.togglePlay);
  const stop = useAnimationStore((s) => s.stop);
  const toggleLoop = useAnimationStore((s) => s.toggleLoop);
  const toggleLoopInRange = useAnimationStore((s) => s.toggleLoopInRange);
  const resetPlayRange = useAnimationStore((s) => s.resetPlayRange);
  const setSpeed = useAnimationStore((s) => s.setSpeed);
  const setTimelineZoom = useAnimationStore((s) => s.setTimelineZoom);
  const undo = useAnimationStore((s) => s.undo);
  const redo = useAnimationStore((s) => s.redo);
  const stepFrame = useAnimationStore((s) => s.stepFrame);

  const disabled = !activeClipId;
  const rangeEnd = playRangeEnd > 0 ? playRangeEnd : duration;
  const effectsEnabled = isEditable && selectedKeyframe !== null;

  const cycleSpeed = () => {
    const idx = SPEEDS.indexOf(speed);
    setSpeed(SPEEDS[(idx + 1) % SPEEDS.length]);
  };

  const applyEasing = (easing: KeyframeEasingId) => {
    if (!selectedKeyframe) return false;
    if (applyToAll) return setEasingForAllBonesAtTime(selectedKeyframe.time, easing);
    return setBoneKeyframeEasing(selectedKeyframe.bone, selectedKeyframe.time, easing);
  };

  return (
    <div className="flex flex-shrink-0 flex-col border-b border-border/50 bg-card/60 backdrop-blur-sm">
      {/* Transport row */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-2 py-1.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-xs font-semibold text-foreground">{clipName}</span>
          {!isEditable && onEditAsCustom && (
            <Button variant="outline" size="xs" onClick={onEditAsCustom}>
              <FilePenLine className="h-3 w-3" />
              Edit
            </Button>
          )}
        </div>

        <div className="flex items-center gap-0.5 rounded-xl border border-border/60 bg-background-subtle/80 p-0.5">
          <FeedbackButton variant="ghost" size="icon" disabled={disabled} title="Stop" className="h-8 w-8" onPress={() => stop()}>
            <SkipBack className="h-3.5 w-3.5" />
          </FeedbackButton>
          <FeedbackButton variant="ghost" size="icon" disabled={disabled} title="Previous frame" className="h-8 w-8" onPress={() => stepFrame(-1)}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </FeedbackButton>
          <FeedbackButton variant="default" size="icon" disabled={disabled} title="Play / Pause" className="h-8 w-8" onPress={() => togglePlay()}>
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </FeedbackButton>
          <FeedbackButton variant="ghost" size="icon" disabled={disabled} title="Next frame" className="h-8 w-8" onPress={() => stepFrame(1)}>
            <ChevronRight className="h-3.5 w-3.5" />
          </FeedbackButton>
        </div>

        <div className="hidden font-mono text-[11px] text-foreground md:block">
          <span className="text-primary">{formatTimecode(currentTime, fps)}</span>
          <span className="text-foreground-muted"> / {formatTimecode(duration, fps)}</span>
        </div>

        <div className="h-5 w-px bg-border/70" />

        <FeedbackButton variant={loop ? "default" : "ghost"} size="icon" disabled={disabled} title="Loop clip" className="h-8 w-8" onPress={() => toggleLoop()}>
          <Repeat className="h-3.5 w-3.5" />
        </FeedbackButton>
        <FeedbackButton
          variant={loopInRange ? "default" : "ghost"}
          size="icon"
          disabled={disabled}
          title={`Loop range ${formatTimeShort(playRangeStart)} – ${formatTimeShort(rangeEnd)}`}
          className={cn("h-8 w-8", loopInRange && "ring-1 ring-primary/30")}
          onPress={() => toggleLoopInRange()}
        >
          <Scan className="h-3.5 w-3.5" />
        </FeedbackButton>
        <FeedbackButton variant="ghost" size="icon" disabled={disabled} title="Reset play range" className="h-8 w-8" onPress={() => resetPlayRange()}>
          <Focus className="h-3.5 w-3.5" />
        </FeedbackButton>

        <FeedbackButton variant="ghost" size="sm" disabled={disabled} onPress={() => cycleSpeed()} title="Playback speed" className="h-8 w-12 font-mono text-[11px]">
          {speed}x
        </FeedbackButton>

        <div className="h-5 w-px bg-border/70" />

        <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-background-subtle/80 px-1 py-0.5">
          <FeedbackButton
            variant="outline"
            size="sm"
            className="h-7 gap-1 px-2 text-[10px]"
            title="Zoom out timeline"
            onPress={() => setTimelineZoom(timelineZoom - 16)}
          >
            <ZoomOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Out</span>
          </FeedbackButton>
          <span className="w-9 text-center font-mono text-[10px] text-foreground-muted">{timelineZoom}</span>
          <FeedbackButton
            variant="outline"
            size="sm"
            className="h-7 gap-1 px-2 text-[10px]"
            title="Zoom in timeline"
            onPress={() => setTimelineZoom(timelineZoom + 16)}
          >
            <ZoomIn className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">In</span>
          </FeedbackButton>
        </div>

        {isEditable && onSetDuration && (
          <div className="flex items-center gap-1 text-[10px] text-foreground-muted">
            <span className="hidden lg:inline">Duration</span>
            <FeedbackButton variant="ghost" size="icon" className="h-7 w-7" title="Shorter" onPress={() => onSetDuration(Math.max(0.5, duration - 0.5))}>
              <Minus className="h-3 w-3" />
            </FeedbackButton>
            <span className="w-10 text-center font-mono text-foreground">{duration.toFixed(1)}s</span>
            <FeedbackButton variant="ghost" size="icon" className="h-7 w-7" title="Longer" onPress={() => onSetDuration(duration + 0.5)}>
              <Plus className="h-3 w-3" />
            </FeedbackButton>
          </div>
        )}

        <div className="ml-auto flex items-center gap-0.5">
          {selectionCount > 0 && (
            <>
              <span className="mr-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                {selectionCount} selected
              </span>
              <FeedbackButton variant="outline" size="xs" title="Delete selected" onPress={() => onDeleteSelection?.()}>
                <Trash2 className="h-3 w-3" />
              </FeedbackButton>
              <FeedbackButton variant="ghost" size="xs" title="Clear selection" onPress={() => onClearSelection?.()}>
                Clear
              </FeedbackButton>
              <div className="mx-1 h-5 w-px bg-border/70" />
            </>
          )}
          <FeedbackButton variant="ghost" size="icon" disabled={undoStack.length === 0} title="Undo" className="h-8 w-8" onPress={() => undo()}>
            <Undo2 className="h-3.5 w-3.5" />
          </FeedbackButton>
          <FeedbackButton variant="ghost" size="icon" disabled={redoStack.length === 0} title="Redo" className="h-8 w-8" onPress={() => redo()}>
            <Redo2 className="h-3.5 w-3.5" />
          </FeedbackButton>
        </div>
      </div>

      {/* Keyframe effects row — always visible on editable clips */}
      {isEditable && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border/40 bg-background-subtle/50 px-2 py-1">
          <div className="flex items-center gap-1.5 text-[10px] text-foreground-muted">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium text-foreground">Effects</span>
            {effectsEnabled ? (
              <span className="max-w-[140px] truncate">
                {selectedKeyframe.bone} @ {selectedKeyframe.time.toFixed(2)}s
              </span>
            ) : (
              <span className="italic opacity-70">select keyframe</span>
            )}
          </div>

          <label
            className={cn(
              "flex items-center gap-1 text-[10px] text-foreground-muted",
              effectsEnabled ? "cursor-pointer" : "cursor-not-allowed opacity-50"
            )}
          >
            <input
              type="checkbox"
              checked={applyToAll}
              disabled={!effectsEnabled}
              onChange={(e) => setApplyToAll(e.target.checked)}
              className="rounded border-border"
            />
            All bones
          </label>

          <div className="h-4 w-px bg-border/60" />

          <div className="custom-scrollbar flex flex-1 items-center gap-1 overflow-x-auto">
            {KEYFRAME_EASINGS.map((def) => {
              const Icon = KEYFRAME_EASING_ICONS[def.id];
              const active = effectsEnabled && currentEasing === def.id;
              return (
                <FeedbackButton
                  key={def.id}
                  variant={active ? "default" : "outline"}
                  size="icon"
                  disabled={!effectsEnabled}
                  title={effectsEnabled ? `${def.name} — ${def.description}` : `${def.name} — select a keyframe`}
                  className={cn("h-7 w-7 flex-shrink-0", active && "ring-1 ring-primary/40")}
                  onPress={() => applyEasing(def.id)}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                  <span className="sr-only">{def.name}</span>
                </FeedbackButton>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
