import { Pause, Play, Redo2, Repeat, SkipBack, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useAnimationStore } from "@/store/animationStore";

const SPEEDS = [0.25, 0.5, 1, 1.5, 2];

function formatTime(t: number) {
  return t.toFixed(2) + "s";
}

export function TransportControls() {
  const isPlaying = useAnimationStore((s) => s.isPlaying);
  const loop = useAnimationStore((s) => s.loop);
  const speed = useAnimationStore((s) => s.speed);
  const currentTime = useAnimationStore((s) => s.currentTime);
  const duration = useAnimationStore((s) => s.duration);
  const activeClipId = useAnimationStore((s) => s.activeClipId);
  const undoStack = useAnimationStore((s) => s.undoStack);
  const redoStack = useAnimationStore((s) => s.redoStack);

  const togglePlay = useAnimationStore((s) => s.togglePlay);
  const stop = useAnimationStore((s) => s.stop);
  const toggleLoop = useAnimationStore((s) => s.toggleLoop);
  const setSpeed = useAnimationStore((s) => s.setSpeed);
  const undo = useAnimationStore((s) => s.undo);
  const redo = useAnimationStore((s) => s.redo);

  const disabled = !activeClipId;

  const cycleSpeed = () => {
    const idx = SPEEDS.indexOf(speed);
    setSpeed(SPEEDS[(idx + 1) % SPEEDS.length]);
  };

  return (
    <div className="flex flex-shrink-0 items-center gap-1.5">
      <Button variant="ghost" size="icon" disabled={disabled} title="Stop / rewind" onClick={stop}>
        <SkipBack className="h-4 w-4" />
      </Button>
      <Button variant="default" size="icon" disabled={disabled} title="Play / pause (space)" onClick={togglePlay}>
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      <Button
        variant={loop ? "default" : "ghost"}
        size="icon"
        disabled={disabled}
        title="Toggle loop"
        onClick={toggleLoop}
      >
        <Repeat className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" disabled={disabled} onClick={cycleSpeed} title="Playback speed" className="w-14 font-mono">
        {speed}x
      </Button>
      <span className="w-24 flex-shrink-0 font-mono text-xs text-foreground-muted">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>

      <div className="mx-1 h-6 w-px bg-border" />

      <Button variant="ghost" size="icon" disabled={undoStack.length === 0} title="Undo (Ctrl+Z)" onClick={undo}>
        <Undo2 className={cn("h-4 w-4", undoStack.length === 0 && "opacity-40")} />
      </Button>
      <Button variant="ghost" size="icon" disabled={redoStack.length === 0} title="Redo (Ctrl+Y)" onClick={redo}>
        <Redo2 className={cn("h-4 w-4", redoStack.length === 0 && "opacity-40")} />
      </Button>
    </div>
  );
}
