import {
  Axis3d,
  Bone,
  Box,
  Focus,
  Grid3x3,
  Lightbulb,
  LightbulbOff,
  Move3d,
  Orbit,
  Rotate3d,
  RotateCcw,
  Scale3d,
  ScanLine,
  Sun,
  SunDim,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useModelStore } from "@/store/modelStore";
import { useAnimationStore, type TransformMode } from "@/store/animationStore";

const MODES: { mode: TransformMode; icon: typeof Move3d; label: string }[] = [
  { mode: "translate", icon: Move3d, label: "Move (W)" },
  { mode: "rotate", icon: Rotate3d, label: "Rotate (E)" },
  { mode: "scale", icon: Scale3d, label: "Scale (R)" },
];

function ToolbarDivider() {
  return <div className="mx-0.5 h-5 w-px bg-border/70" />;
}

export function ViewportToolbar() {
  const transformMode = useAnimationStore((s) => s.transformMode);
  const setTransformMode = useAnimationStore((s) => s.setTransformMode);

  const wireframe = useModelStore((s) => s.wireframe);
  const toggleWireframe = useModelStore((s) => s.toggleWireframe);
  const showSkeleton = useModelStore((s) => s.showSkeleton);
  const toggleSkeleton = useModelStore((s) => s.toggleSkeleton);
  const showGrid = useModelStore((s) => s.showGrid);
  const toggleGrid = useModelStore((s) => s.toggleGrid);
  const showLights = useModelStore((s) => s.showLights);
  const toggleLights = useModelStore((s) => s.toggleLights);
  const showShadows = useModelStore((s) => s.showShadows);
  const toggleShadows = useModelStore((s) => s.toggleShadows);
  const showAxes = useModelStore((s) => s.showAxes);
  const toggleAxes = useModelStore((s) => s.toggleAxes);
  const autoRotate = useModelStore((s) => s.autoRotate);
  const toggleAutoRotate = useModelStore((s) => s.toggleAutoRotate);
  const resetToRestPose = useModelStore((s) => s.resetToRestPose);
  const requestFrameCamera = useModelStore((s) => s.requestFrameCamera);
  const selectedBoneNames = useModelStore((s) => s.selectedBoneNames);
  const model = useModelStore((s) => s.model);
  const hasSelection = selectedBoneNames.length > 0;

  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2.5">
        <div className="pointer-events-auto flex items-center gap-1 rounded-xl border border-border bg-card/80 p-1 backdrop-blur-sm">
          {MODES.map(({ mode, icon: Icon, label }) => (
            <Button
              key={mode}
              variant={transformMode === mode ? "default" : "ghost"}
              size="icon"
              title={label}
              disabled={!hasSelection}
              onClick={() => setTransformMode(mode)}
            >
              <Icon className="h-4 w-4" />
            </Button>
          ))}
        </div>

        <div
          className={cn(
            "pointer-events-auto flex max-w-[min(100%,42rem)] flex-wrap items-center justify-end gap-1 rounded-xl border border-border bg-card/80 p-1 backdrop-blur-sm"
          )}
        >
          <Button
            variant={showLights ? "default" : "ghost"}
            size="icon"
            title={showLights ? "Studio lights on" : "Flat lighting (lights off)"}
            onClick={toggleLights}
          >
            {showLights ? <Lightbulb className="h-4 w-4" /> : <LightbulbOff className="h-4 w-4" />}
          </Button>
          <Button
            variant={showShadows ? "default" : "ghost"}
            size="icon"
            title={showShadows ? "Shadows on" : "Shadows off"}
            onClick={toggleShadows}
          >
            {showShadows ? <Sun className="h-4 w-4" /> : <SunDim className="h-4 w-4" />}
          </Button>

          <ToolbarDivider />

          <Button variant={showGrid ? "default" : "ghost"} size="icon" title="Toggle grid" onClick={toggleGrid}>
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={wireframe ? "default" : "ghost"}
            size="icon"
            title="Toggle wireframe"
            onClick={toggleWireframe}
          >
            {wireframe ? <ScanLine className="h-4 w-4" /> : <Box className="h-4 w-4" />}
          </Button>
          <Button
            variant={showSkeleton ? "default" : "ghost"}
            size="icon"
            title="Toggle skeleton overlay"
            onClick={toggleSkeleton}
          >
            <Bone className="h-4 w-4" />
          </Button>
          <Button variant={showAxes ? "default" : "ghost"} size="icon" title="Toggle axis helper (X/Y/Z)" onClick={toggleAxes}>
            <Axis3d className="h-4 w-4" />
          </Button>

          <ToolbarDivider />

          <Button
            variant={autoRotate ? "default" : "ghost"}
            size="icon"
            title="Auto-rotate camera"
            onClick={toggleAutoRotate}
          >
            <Orbit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Frame model in view (F)"
            disabled={!model}
            onClick={requestFrameCamera}
          >
            <Focus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" title="Reset pose to bind pose" disabled={!model} onClick={resetToRestPose}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
}
