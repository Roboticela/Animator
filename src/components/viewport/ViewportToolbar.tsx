import type { RefObject } from "react";
import {
  ArrowDownToLine,
  Axis3d,
  Bone,
  Bookmark,
  Box,
  Focus,
  Gauge,
  Grid3x3,
  Lightbulb,
  LightbulbOff,
  Move3d,
  Orbit,
  Rotate3d,
  RotateCcw,
  Scale3d,
  ScanLine,
  Shuffle,
  Sun,
  SunDim,
} from "lucide-react";
import { FeedbackButton } from "@/components/ui/FeedbackButton";
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

export function ViewportToolbar({ viewportRoot: _viewportRoot }: { viewportRoot: RefObject<HTMLElement | null> }) {
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
  const showFps = useModelStore((s) => s.showFps);
  const toggleShowFps = useModelStore((s) => s.toggleShowFps);
  const resetToRestPose = useModelStore((s) => s.resetToRestPose);
  const captureRestPose = useModelStore((s) => s.captureRestPose);
  const centerModelOnGround = useModelStore((s) => s.centerModelOnGround);
  const invertBoneSelection = useModelStore((s) => s.invertBoneSelection);
  const requestFrameCamera = useModelStore((s) => s.requestFrameCamera);
  const selectedBoneNames = useModelStore((s) => s.selectedBoneNames);
  const model = useModelStore((s) => s.model);
  const hasSelection = selectedBoneNames.length > 0;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2.5">
      <div className="pointer-events-auto flex items-center gap-1 rounded-xl border border-border bg-card/80 p-1 backdrop-blur-sm">
        {MODES.map(({ mode, icon: Icon, label }) => (
          <FeedbackButton
            key={mode}
            variant={transformMode === mode ? "default" : "ghost"}
            size="icon"
            title={label}
            disabled={!hasSelection}
            onPress={() => setTransformMode(mode)}
          >
            <Icon className="h-4 w-4" />
          </FeedbackButton>
        ))}
      </div>

      <div
        className={cn(
          "pointer-events-auto flex max-w-[min(100%,46rem)] flex-wrap items-center justify-end gap-1 rounded-xl border border-border bg-card/80 p-1 backdrop-blur-sm"
        )}
      >
        <FeedbackButton
          variant={showLights ? "default" : "ghost"}
          size="icon"
          title={showLights ? "Studio lights on (L)" : "Flat lighting (L)"}
          onPress={() => toggleLights()}
        >
          {showLights ? <Lightbulb className="h-4 w-4" /> : <LightbulbOff className="h-4 w-4" />}
        </FeedbackButton>
        <FeedbackButton
          variant={showShadows ? "default" : "ghost"}
          size="icon"
          title="Toggle shadows (H)"
          onPress={() => toggleShadows()}
        >
          {showShadows ? <Sun className="h-4 w-4" /> : <SunDim className="h-4 w-4" />}
        </FeedbackButton>
        <FeedbackButton
          variant={showFps ? "default" : "ghost"}
          size="icon"
          title="Show FPS in status bar"
          onPress={() => toggleShowFps()}
        >
          <Gauge className="h-4 w-4" />
        </FeedbackButton>

        <ToolbarDivider />

        <FeedbackButton variant={showGrid ? "default" : "ghost"} size="icon" title="Toggle grid (G)" onPress={() => toggleGrid()}>
          <Grid3x3 className="h-4 w-4" />
        </FeedbackButton>
        <FeedbackButton
          variant={wireframe ? "default" : "ghost"}
          size="icon"
          title="Toggle wireframe"
          onPress={() => toggleWireframe()}
        >
          {wireframe ? <ScanLine className="h-4 w-4" /> : <Box className="h-4 w-4" />}
        </FeedbackButton>
        <FeedbackButton
          variant={showSkeleton ? "default" : "ghost"}
          size="icon"
          title="Toggle skeleton overlay"
          onPress={() => toggleSkeleton()}
        >
          <Bone className="h-4 w-4" />
        </FeedbackButton>
        <FeedbackButton variant={showAxes ? "default" : "ghost"} size="icon" title="Toggle axis helper" onPress={() => toggleAxes()}>
          <Axis3d className="h-4 w-4" />
        </FeedbackButton>

        <ToolbarDivider />

        <FeedbackButton
          variant={autoRotate ? "default" : "ghost"}
          size="icon"
          title="Auto-rotate camera"
          onPress={() => toggleAutoRotate()}
        >
          <Orbit className="h-4 w-4" />
        </FeedbackButton>
        <FeedbackButton
          variant="ghost"
          size="icon"
          title="Frame model (F)"
          disabled={!model}
          onPress={() => requestFrameCamera()}
        >
          <Focus className="h-4 w-4" />
        </FeedbackButton>
        <FeedbackButton
          variant="ghost"
          size="icon"
          title="Invert bone selection"
          disabled={!model}
          onPress={() => invertBoneSelection()}
        >
          <Shuffle className="h-4 w-4" />
        </FeedbackButton>
        <FeedbackButton
          variant="ghost"
          size="icon"
          title="Center model on ground"
          disabled={!model}
          onPress={() => centerModelOnGround()}
        >
          <ArrowDownToLine className="h-4 w-4" />
        </FeedbackButton>
        <FeedbackButton
          variant="ghost"
          size="icon"
          title="Capture current pose as bind pose"
          disabled={!model}
          onPress={() => captureRestPose()}
        >
          <Bookmark className="h-4 w-4" />
        </FeedbackButton>
        <FeedbackButton
          variant="ghost"
          size="icon"
          title="Reset all bones to bind pose"
          disabled={!model}
          onPress={() => resetToRestPose()}
        >
          <RotateCcw className="h-4 w-4" />
        </FeedbackButton>
      </div>
    </div>
  );
}
