import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowDownToLine,
  ArrowDownUp,
  ArrowRightToLine,
  ArrowUpFromLine,
  AudioWaveform,
  Boxes,
  ChevronLeft,
  ChevronRight,
  ChevronsDown,
  ChevronsUp,
  CornerDownRight,
  CornerUpLeft,
  FilePenLine,
  Flag,
  Flame,
  Focus,
  Gauge,
  Magnet,
  MoveHorizontal,
  Pause,
  Play,
  Redo2,
  Repeat,
  Rewind,
  Scan,
  SkipBack,
  SlidersHorizontal,
  Spline,
  Square,
  Trash2,
  TrendingDown,
  TrendingUp,
  Undo2,
  Vibrate,
  Waves,
  X,
  Zap,
} from "lucide-react";
import { FeedbackButton } from "@/components/ui/FeedbackButton";
import { cn } from "@/lib/utils";
import { formatTimeShort, formatTimecode } from "@/lib/timeline-utils";
import type { KeyframeEasingId } from "@/lib/keyframe-easing";
import { KEYFRAME_EASINGS } from "@/lib/keyframe-easing";
import { setBoneKeyframeEasing, setEasingForAllBonesAtTime } from "@/lib/app-actions";
import { useAnimationStore } from "@/store/animationStore";

const SPEEDS = [0.25, 0.5, 1, 1.5, 2];

const KEYFRAME_EASING_ICONS: Record<KeyframeEasingId, LucideIcon> = {
  linear: MoveHorizontal,
  easeIn: TrendingUp,
  easeOut: TrendingDown,
  easeInOut: Spline,
  smooth: Waves,
  sineIn: ArrowUpFromLine,
  sineOut: ArrowDownToLine,
  sineInOut: AudioWaveform,
  expoIn: Flame,
  expoOut: Zap,
  quartIn: ChevronsUp,
  quartOut: ChevronsDown,
  hold: Square,
  easeInBack: CornerUpLeft,
  easeOutBack: CornerDownRight,
  anticipate: Rewind,
  overshoot: ArrowRightToLine,
  bounce: ArrowDownUp,
  elastic: Vibrate,
};

interface TimelineToolbarProps {
  clipName: string;
  isEditable: boolean;
  fps: number;
  selectedKeyframe: { bone: string; time: number } | null;
  currentEasing: KeyframeEasingId;
  selectionCount: number;
  snapToFrames: boolean;
  onToggleSnap: () => void;
  onEditAsCustom?: () => void;
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
  snapToFrames,
  onToggleSnap,
  onEditAsCustom,
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
  const activeClipId = useAnimationStore((s) => s.activeClipId);
  const undoStack = useAnimationStore((s) => s.undoStack);
  const redoStack = useAnimationStore((s) => s.redoStack);

  const togglePlay = useAnimationStore((s) => s.togglePlay);
  const stop = useAnimationStore((s) => s.stop);
  const seek = useAnimationStore((s) => s.seek);
  const toggleLoop = useAnimationStore((s) => s.toggleLoop);
  const toggleLoopInRange = useAnimationStore((s) => s.toggleLoopInRange);
  const resetPlayRange = useAnimationStore((s) => s.resetPlayRange);
  const setSpeed = useAnimationStore((s) => s.setSpeed);
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
    <div className="flex flex-shrink-0 flex-nowrap items-center gap-1.5 overflow-x-auto border-b border-border/50 bg-card/70 px-2 py-1.5 backdrop-blur-md custom-scrollbar">
      {/* Clip name */}
      <div className="flex flex-shrink-0 items-center gap-1.5">
        <span className="max-w-[120px] truncate text-xs font-semibold text-foreground">{clipName}</span>
        {!isEditable && onEditAsCustom && (
          <FeedbackButton variant="outline" size="icon" className="h-7 w-7" title="Edit as custom clip" onPress={() => onEditAsCustom()}>
            <FilePenLine className="h-3.5 w-3.5" />
          </FeedbackButton>
        )}
      </div>

      <div className="h-5 w-px flex-shrink-0 bg-border/60" />

      {/* Transport */}
      <div className="flex flex-shrink-0 items-center gap-0.5 rounded-lg border border-border/50 bg-background-subtle/90 p-0.5 shadow-sm">
        <FeedbackButton variant="ghost" size="icon" disabled={disabled} title="Stop" className="h-7 w-7" onPress={() => stop()}>
          <SkipBack className="h-3.5 w-3.5" />
        </FeedbackButton>
        <FeedbackButton variant="ghost" size="icon" disabled={disabled} title="Previous frame" className="h-7 w-7" onPress={() => stepFrame(-1)}>
          <ChevronLeft className="h-3.5 w-3.5" />
        </FeedbackButton>
        <FeedbackButton variant="default" size="icon" disabled={disabled} title="Play / Pause" className="h-7 w-7" onPress={() => togglePlay()}>
          {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </FeedbackButton>
        <FeedbackButton variant="ghost" size="icon" disabled={disabled} title="Next frame" className="h-7 w-7" onPress={() => stepFrame(1)}>
          <ChevronRight className="h-3.5 w-3.5" />
        </FeedbackButton>
      </div>

      <span className="hidden flex-shrink-0 font-mono text-[10px] text-foreground lg:inline">
        <span className="text-primary">{formatTimecode(currentTime, fps)}</span>
        <span className="text-foreground-muted"> / {formatTimecode(duration, fps)}</span>
      </span>

      <div className="h-5 w-px flex-shrink-0 bg-border/60" />

      {/* Loop & range */}
      <FeedbackButton variant={loop ? "default" : "ghost"} size="icon" disabled={disabled} title="Loop clip" className="h-7 w-7 flex-shrink-0" onPress={() => toggleLoop()}>
        <Repeat className="h-3.5 w-3.5" />
      </FeedbackButton>
      <FeedbackButton
        variant={loopInRange ? "default" : "ghost"}
        size="icon"
        disabled={disabled}
        title={`Loop range ${formatTimeShort(playRangeStart)} – ${formatTimeShort(rangeEnd)}`}
        className={cn("h-7 w-7 flex-shrink-0", loopInRange && "ring-1 ring-primary/30")}
        onPress={() => toggleLoopInRange()}
      >
        <Scan className="h-3.5 w-3.5" />
      </FeedbackButton>
      <FeedbackButton variant="ghost" size="icon" disabled={disabled} title="Go to range start" className="h-7 w-7 flex-shrink-0" onPress={() => seek(playRangeStart)}>
        <Flag className="h-3 w-3 -scale-x-100" />
      </FeedbackButton>
      <FeedbackButton variant="ghost" size="icon" disabled={disabled} title="Go to range end" className="h-7 w-7 flex-shrink-0" onPress={() => seek(rangeEnd)}>
        <Flag className="h-3 w-3" />
      </FeedbackButton>
      <FeedbackButton variant="ghost" size="icon" disabled={disabled} title="Reset play range" className="h-7 w-7 flex-shrink-0" onPress={() => resetPlayRange()}>
        <Focus className="h-3.5 w-3.5" />
      </FeedbackButton>

      <FeedbackButton
        variant="ghost"
        size="icon"
        disabled={disabled}
        onPress={() => cycleSpeed()}
        title={`Playback speed: ${speed}x`}
        className="h-7 w-7 flex-shrink-0"
      >
        <Gauge className="h-3.5 w-3.5" />
      </FeedbackButton>

      <div className="h-5 w-px flex-shrink-0 bg-border/60" />

      <FeedbackButton
        variant={snapToFrames ? "default" : "ghost"}
        size="icon"
        disabled={!isEditable}
        title="Snap keyframes to frames"
        className="h-7 w-7 flex-shrink-0"
        onPress={() => onToggleSnap()}
      >
        <Magnet className="h-3.5 w-3.5" />
      </FeedbackButton>

      {/* Keyframe easing */}
      {isEditable && (
        <>
          <div className="h-5 w-px flex-shrink-0 bg-border/60" />
          <FeedbackButton
            variant="ghost"
            size="icon"
            disabled={!effectsEnabled}
            title={
              effectsEnabled
                ? `Easing for ${selectedKeyframe.bone} @ ${selectedKeyframe.time.toFixed(2)}s`
                : "Keyframe easing — select a keyframe"
            }
            className="h-7 w-7 flex-shrink-0 pointer-events-none opacity-70"
            onPress={() => {}}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </FeedbackButton>
          <FeedbackButton
            variant={applyToAll ? "default" : "ghost"}
            size="icon"
            disabled={!effectsEnabled}
            title={applyToAll ? "Apply easing to all bones at this time" : "Apply easing to selected bone only"}
            className="h-7 w-7 flex-shrink-0"
            onPress={() => setApplyToAll((v) => !v)}
          >
            <Boxes className="h-3.5 w-3.5" />
          </FeedbackButton>
          <div className="flex flex-shrink-0 items-center gap-0.5">
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
                </FeedbackButton>
              );
            })}
          </div>
        </>
      )}

      {/* Selection & history — pushed right */}
      <div className="ml-auto flex flex-shrink-0 items-center gap-0.5">
        {selectionCount > 0 && (
          <>
            <FeedbackButton
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title={`${selectionCount} keyframe${selectionCount === 1 ? "" : "s"} selected`}
              onPress={() => {}}
            >
              <span className="text-[10px] font-semibold tabular-nums">{selectionCount}</span>
            </FeedbackButton>
            <FeedbackButton variant="outline" size="icon" className="h-7 w-7" title="Delete selected keyframes" onPress={() => onDeleteSelection?.()}>
              <Trash2 className="h-3.5 w-3.5" />
            </FeedbackButton>
            <FeedbackButton variant="ghost" size="icon" className="h-7 w-7" title="Clear selection" onPress={() => onClearSelection?.()}>
              <X className="h-3.5 w-3.5" />
            </FeedbackButton>
            <div className="mx-0.5 h-5 w-px bg-border/60" />
          </>
        )}
        <FeedbackButton variant="ghost" size="icon" disabled={undoStack.length === 0} title="Undo" className="h-7 w-7" onPress={() => undo()}>
          <Undo2 className="h-3.5 w-3.5" />
        </FeedbackButton>
        <FeedbackButton variant="ghost" size="icon" disabled={redoStack.length === 0} title="Redo" className="h-7 w-7" onPress={() => redo()}>
          <Redo2 className="h-3.5 w-3.5" />
        </FeedbackButton>
      </div>
    </div>
  );
}
