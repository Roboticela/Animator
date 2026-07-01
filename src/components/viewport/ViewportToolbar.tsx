import { Bone, Eye, EyeOff, Grid3x3, Move, RefreshCcw, RotateCw, Scaling } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useModelStore } from "@/store/modelStore";
import { useAnimationStore, type TransformMode } from "@/store/animationStore";

const MODES: { mode: TransformMode; icon: typeof Move; label: string }[] = [
  { mode: "translate", icon: Move, label: "Move (W)" },
  { mode: "rotate", icon: RotateCw, label: "Rotate (E)" },
  { mode: "scale", icon: Scaling, label: "Scale (R)" },
];

export function ViewportToolbar() {
  const transformMode = useAnimationStore((s) => s.transformMode);
  const setTransformMode = useAnimationStore((s) => s.setTransformMode);
  const wireframe = useModelStore((s) => s.wireframe);
  const toggleWireframe = useModelStore((s) => s.toggleWireframe);
  const showSkeleton = useModelStore((s) => s.showSkeleton);
  const toggleSkeleton = useModelStore((s) => s.toggleSkeleton);
  const showGrid = useModelStore((s) => s.showGrid);
  const toggleGrid = useModelStore((s) => s.toggleGrid);
  const resetToRestPose = useModelStore((s) => s.resetToRestPose);
  const selectedBoneName = useModelStore((s) => s.selectedBoneName);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-2.5">
      <div className="pointer-events-auto flex items-center gap-1 rounded-xl border border-border bg-card/80 p-1 backdrop-blur-sm">
        {MODES.map(({ mode, icon: Icon, label }) => (
          <Button
            key={mode}
            variant={transformMode === mode ? "default" : "ghost"}
            size="icon"
            title={label}
            disabled={!selectedBoneName}
            onClick={() => setTransformMode(mode)}
          >
            <Icon className="h-4 w-4" />
          </Button>
        ))}
      </div>

      <div className="pointer-events-auto flex items-center gap-1 rounded-xl border border-border bg-card/80 p-1 backdrop-blur-sm">
        <Button variant="ghost" size="icon" title="Reset pose to bind pose" onClick={resetToRestPose}>
          <RefreshCcw className="h-4 w-4" />
        </Button>
        <Button
          variant={showSkeleton ? "default" : "ghost"}
          size="icon"
          title="Toggle skeleton overlay"
          onClick={toggleSkeleton}
        >
          <Bone className="h-4 w-4" />
        </Button>
        <Button variant={showGrid ? "default" : "ghost"} size="icon" title="Toggle grid" onClick={toggleGrid}>
          <Grid3x3 className="h-4 w-4" />
        </Button>
        <Button
          variant={wireframe ? "default" : "ghost"}
          size="icon"
          title="Toggle wireframe"
          onClick={toggleWireframe}
        >
          {wireframe ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
