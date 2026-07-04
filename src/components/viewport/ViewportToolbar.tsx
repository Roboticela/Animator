import type { RefObject } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowLeftRight,
  Axis3d,
  Bone,
  Check,
  Contrast,
  Cuboid,
  Focus,
  Grid3x3,
  Lightbulb,
  LightbulbOff,
  Move,
  Orbit,
  RotateCcw,
  RotateCw,
  Save,
  Scale3d,
  Sun,
  Waypoints,
  ChevronDown,
} from "lucide-react";
import { FeedbackButton } from "@/components/ui/FeedbackButton";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useModelStore } from "@/store/modelStore";
import { useAnimationStore, type TransformMode } from "@/store/animationStore";
import { HDR_ENVIRONMENT_OPTIONS, lightingModeLabel } from "@/lib/viewport-lighting";

const MODES: { mode: TransformMode; icon: typeof Move; label: string }[] = [
  { mode: "translate", icon: Move, label: "Move (W)" },
  { mode: "rotate", icon: RotateCw, label: "Rotate (E)" },
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
  const lightingMode = useModelStore((s) => s.lightingMode);
  const hdrEnvironment = useModelStore((s) => s.hdrEnvironment);
  const setLightingMode = useModelStore((s) => s.setLightingMode);
  const setHdrEnvironment = useModelStore((s) => s.setHdrEnvironment);
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
  const selectedMeshUuids = useModelStore((s) => s.selectedMeshUuids);
  const selectedReferenceIds = useModelStore((s) => s.selectedReferenceIds);
  const viewportSelectionTarget = useModelStore((s) => s.viewportSelectionTarget);
  const meshElementMode = useModelStore((s) => s.meshElementMode);
  const model = useModelStore((s) => s.model);
  const hasBoneSelection = selectedBoneNames.length > 0;
  const hasPartSelection = selectedMeshUuids.length > 0;
  const hasReferenceSelection = selectedReferenceIds.length > 0;
  const hasTransformSelection =
    viewportSelectionTarget === "bones"
      ? hasBoneSelection
      : viewportSelectionTarget === "references"
        ? hasReferenceSelection
        : hasPartSelection && meshElementMode === "object";

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2.5">
      <div className="pointer-events-auto flex items-center gap-1 rounded-xl border border-border bg-card/80 p-1 backdrop-blur-sm">
        {MODES.map(({ mode, icon: Icon, label }) => (
          <FeedbackButton
            key={mode}
            variant={transformMode === mode ? "default" : "ghost"}
            size="icon"
            title={label}
            disabled={!hasTransformSelection}
            onPress={() => setTransformMode(mode)}
          >
            <Icon className="h-4 w-4" />
          </FeedbackButton>
        ))}
      </div>

      <div
        className={cn(
          "pointer-events-auto flex max-w-[min(100%,52rem)] flex-wrap items-center justify-end gap-1 rounded-xl border border-border bg-card/80 p-1 backdrop-blur-sm"
        )}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={lightingMode !== "flat" ? "default" : "ghost"}
              size="sm"
              className="group h-10 gap-0.5 px-2"
              title={`Lighting: ${lightingModeLabel(lightingMode)} (L to cycle)`}
            >
              {lightingMode === "hdr" ? (
                <Sun className="h-4 w-4" />
              ) : lightingMode === "studio" ? (
                <Lightbulb className="h-4 w-4" />
              ) : (
                <LightbulbOff className="h-4 w-4" />
              )}
              <ChevronDown className="h-3 w-3 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => setLightingMode("flat")}>
              <LightbulbOff className="h-4 w-4" />
              <span className="flex-1">Flat</span>
              {lightingMode === "flat" && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLightingMode("studio")}>
              <Lightbulb className="h-4 w-4" />
              <span className="flex-1">Studio</span>
              {lightingMode === "studio" && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-foreground/45">
              HDR environments
            </p>
            {HDR_ENVIRONMENT_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.id}
                onClick={() => setHdrEnvironment(option.id)}
                title={option.hint}
              >
                <Sun className="h-4 w-4" />
                <span className="flex-1">{option.label}</span>
                {lightingMode === "hdr" && hdrEnvironment === option.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <FeedbackButton
          variant={showShadows ? "default" : "ghost"}
          size="icon"
          title={showShadows ? "Ground shadows on (H)" : "Ground shadows off (H)"}
          onPress={() => toggleShadows()}
        >
          <Contrast className={cn("h-4 w-4", !showShadows && "opacity-45")} />
        </FeedbackButton>
        <FeedbackButton
          variant={showFps ? "default" : "ghost"}
          size="icon"
          title="Show FPS in status bar"
          onPress={() => toggleShowFps()}
        >
          <Activity className="h-4 w-4" />
        </FeedbackButton>

        <ToolbarDivider />

        <FeedbackButton variant={showGrid ? "default" : "ghost"} size="icon" title="Toggle floor grid (G)" onPress={() => toggleGrid()}>
          <Grid3x3 className="h-4 w-4" />
        </FeedbackButton>
        <FeedbackButton
          variant={wireframe ? "default" : "ghost"}
          size="icon"
          title={wireframe ? "Solid shading" : "Wireframe overlay"}
          onPress={() => toggleWireframe()}
        >
          {wireframe ? <Waypoints className="h-4 w-4" /> : <Cuboid className="h-4 w-4" />}
        </FeedbackButton>
        <FeedbackButton
          variant={showSkeleton ? "default" : "ghost"}
          size="icon"
          title={showSkeleton ? "Hide skeleton bones" : "Show skeleton bones"}
          onPress={() => toggleSkeleton()}
        >
          <Bone className="h-4 w-4" />
        </FeedbackButton>
        <FeedbackButton variant={showAxes ? "default" : "ghost"} size="icon" title="Toggle world axes" onPress={() => toggleAxes()}>
          <Axis3d className="h-4 w-4" />
        </FeedbackButton>

        <ToolbarDivider />

        <FeedbackButton
          variant={autoRotate ? "default" : "ghost"}
          size="icon"
          title={autoRotate ? "Stop camera orbit" : "Orbit camera around model"}
          onPress={() => toggleAutoRotate()}
        >
          <Orbit className="h-4 w-4" />
        </FeedbackButton>
        <FeedbackButton
          variant="ghost"
          size="icon"
          title="Frame entire model (F)"
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
          <ArrowLeftRight className="h-4 w-4" />
        </FeedbackButton>

        <ToolbarDivider />

        <FeedbackButton
          variant="ghost"
          size="icon"
          title="Drop model onto ground plane"
          disabled={!model}
          onPress={() => centerModelOnGround()}
        >
          <ArrowDownToLine className="h-4 w-4" />
        </FeedbackButton>
        <FeedbackButton
          variant="ghost"
          size="icon"
          title="Save current pose as bind pose"
          disabled={!model}
          onPress={() => captureRestPose()}
        >
          <Save className="h-4 w-4" />
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
