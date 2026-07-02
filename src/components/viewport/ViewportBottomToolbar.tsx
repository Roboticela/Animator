import type { RefObject } from "react";
import {
  Bone,
  Box,
  Camera,
  Circle,
  Clipboard,
  ClipboardPaste,
  Compass,
  Diamond,
  Eye,
  EyeOff,
  Filter,
  FlipHorizontal2,
  Fullscreen,
  Globe,
  Grid2x2,
  Home,
  Layers,
  Layers2,
  ListTree,
  ScanEye,
  Triangle,
  Video,
  X,
} from "lucide-react";
import { FeedbackButton } from "@/components/ui/FeedbackButton";
import { cn } from "@/lib/utils";
import { useModelStore } from "@/store/modelStore";
import { useAnimationStore } from "@/store/animationStore";
import {
  copySelectedBoneTransforms,
  mirrorSelectedBonesOnX,
  pasteSelectedBoneTransforms,
  resetSelectedBones,
  setKeyframesForSelection,
} from "@/lib/app-actions";
import { hasBoneClipboard } from "@/lib/bone-clipboard";
import { downloadViewportScreenshot, getViewportCanvas } from "@/lib/viewport-screenshot";

function ToolbarDivider() {
  return <div className="mx-0.5 h-5 w-px bg-border/70" />;
}

interface ViewportBottomToolbarProps {
  viewportRoot: RefObject<HTMLElement | null>;
}

export function ViewportBottomToolbar({ viewportRoot }: ViewportBottomToolbarProps) {
  const model = useModelStore((s) => s.model);
  const selectedBoneNames = useModelStore((s) => s.selectedBoneNames);
  const selectedMeshUuids = useModelStore((s) => s.selectedMeshUuids);
  const viewportSelectionTarget = useModelStore((s) => s.viewportSelectionTarget);
  const setViewportSelectionTarget = useModelStore((s) => s.setViewportSelectionTarget);
  const selectAllActive = useModelStore((s) => s.selectAllActive);
  const clearActiveSelection = useModelStore((s) => s.clearActiveSelection);
  const pickingBones = viewportSelectionTarget === "bones";
  const hasSelection = pickingBones ? selectedBoneNames.length > 0 : selectedMeshUuids.length > 0;

  const showMesh = useModelStore((s) => s.showMesh);
  const toggleShowMesh = useModelStore((s) => s.toggleShowMesh);
  const orthographicCamera = useModelStore((s) => s.orthographicCamera);
  const toggleOrthographicCamera = useModelStore((s) => s.toggleOrthographicCamera);
  const flatShading = useModelStore((s) => s.flatShading);
  const toggleFlatShading = useModelStore((s) => s.toggleFlatShading);
  const doubleSided = useModelStore((s) => s.doubleSided);
  const toggleDoubleSided = useModelStore((s) => s.toggleDoubleSided);
  const isolateSelection = useModelStore((s) => s.isolateSelection);
  const toggleIsolateSelection = useModelStore((s) => s.toggleIsolateSelection);
  const requestFrameSelection = useModelStore((s) => s.requestFrameSelection);

  const gizmoSpace = useAnimationStore((s) => s.gizmoSpace);
  const toggleGizmoSpace = useAnimationStore((s) => s.toggleGizmoSpace);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-2.5">
      <div className="pointer-events-auto flex max-w-[min(100%,52rem)] flex-wrap items-center gap-1 rounded-xl border border-border bg-card/80 p-1 backdrop-blur-sm">
        <div className="flex gap-0.5 rounded-lg border border-border/50 bg-background-subtle/80 p-0.5">
          <FeedbackButton
            variant={pickingBones ? "default" : "ghost"}
            size="icon"
            title="Select bones in viewport"
            className="h-7 w-7"
            onPress={() => setViewportSelectionTarget("bones")}
          >
            <Bone className="h-4 w-4" />
          </FeedbackButton>
          <FeedbackButton
            variant={!pickingBones ? "default" : "ghost"}
            size="icon"
            title="Select mesh parts in viewport"
            className="h-7 w-7"
            onPress={() => setViewportSelectionTarget("parts")}
          >
            <Box className="h-4 w-4" />
          </FeedbackButton>
        </div>

        <ToolbarDivider />

        <FeedbackButton
          variant="ghost"
          size="icon"
          title={pickingBones ? "Select all bones (Ctrl+A)" : "Select all parts (Ctrl+A)"}
          disabled={!model}
          onPress={() => selectAllActive()}
        >
          <ListTree className="h-4 w-4" />
        </FeedbackButton>
        <FeedbackButton
          variant="ghost"
          size="icon"
          title="Clear selection (Esc)"
          disabled={!hasSelection}
          onPress={() => clearActiveSelection()}
        >
          <X className="h-4 w-4" />
        </FeedbackButton>

        {pickingBones && (
          <>
        <ToolbarDivider />

        <FeedbackButton
          variant="ghost"
          size="icon"
          title="Copy transforms (Ctrl+C)"
          disabled={!hasSelection}
          onPress={() => copySelectedBoneTransforms() > 0}
        >
          <Clipboard className="h-4 w-4" />
        </FeedbackButton>
        <FeedbackButton
          variant="ghost"
          size="icon"
          title="Paste transforms (Ctrl+V)"
          disabled={!hasSelection || !hasBoneClipboard()}
          onPress={() => pasteSelectedBoneTransforms() > 0}
        >
          <ClipboardPaste className="h-4 w-4" />
        </FeedbackButton>
        <FeedbackButton
          variant="ghost"
          size="icon"
          title="Mirror selection on X (M)"
          disabled={!hasSelection}
          onPress={() => mirrorSelectedBonesOnX()}
        >
          <FlipHorizontal2 className="h-4 w-4" />
        </FeedbackButton>
        <FeedbackButton
          variant="ghost"
          size="icon"
          title="Set keyframe at playhead (K)"
          disabled={!hasSelection}
          onPress={() => setKeyframesForSelection()}
        >
          <Diamond className="h-4 w-4" />
        </FeedbackButton>
        <FeedbackButton
          variant="ghost"
          size="icon"
          title="Reset selected bones to bind pose (Home)"
          disabled={!hasSelection}
          onPress={() => resetSelectedBones()}
        >
          <Home className="h-4 w-4" />
        </FeedbackButton>

        <ToolbarDivider />

        <FeedbackButton
          variant="ghost"
          size="icon"
          title="Frame selected bones (.)"
          disabled={!hasSelection}
          onPress={() => requestFrameSelection()}
        >
          <ScanEye className="h-4 w-4" />
        </FeedbackButton>
        <FeedbackButton
          variant={isolateSelection ? "default" : "ghost"}
          size="icon"
          title={isolateSelection ? "Show full skeleton" : "Isolate selected bones"}
          disabled={!hasSelection}
          onPress={() => toggleIsolateSelection()}
        >
          <Filter className="h-4 w-4" />
        </FeedbackButton>
        <FeedbackButton
          variant={gizmoSpace === "world" ? "default" : "ghost"}
          size="icon"
          title={`Gizmo ${gizmoSpace === "world" ? "world" : "local"} space (X)`}
          disabled={!hasSelection}
          onPress={() => toggleGizmoSpace()}
        >
          {gizmoSpace === "world" ? <Globe className="h-4 w-4" /> : <Compass className="h-4 w-4" />}
        </FeedbackButton>
          </>
        )}
      </div>

      <div
        className={cn(
          "pointer-events-auto flex flex-wrap items-center justify-end gap-1 rounded-xl border border-border bg-card/80 p-1 backdrop-blur-sm"
        )}
      >
        <FeedbackButton
          variant={showMesh ? "default" : "ghost"}
          size="icon"
          title={showMesh ? "Hide mesh" : "Show mesh"}
          disabled={!model}
          onPress={() => toggleShowMesh()}
        >
          {showMesh ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </FeedbackButton>
        <FeedbackButton
          variant={orthographicCamera ? "default" : "ghost"}
          size="icon"
          title={orthographicCamera ? "Perspective camera (O)" : "Orthographic camera (O)"}
          onPress={() => toggleOrthographicCamera()}
        >
          {orthographicCamera ? <Grid2x2 className="h-4 w-4" /> : <Video className="h-4 w-4" />}
        </FeedbackButton>
        <FeedbackButton
          variant={flatShading ? "default" : "ghost"}
          size="icon"
          title={flatShading ? "Smooth shading" : "Flat shading"}
          disabled={!model}
          onPress={() => toggleFlatShading()}
        >
          {flatShading ? <Triangle className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
        </FeedbackButton>
        <FeedbackButton
          variant={doubleSided ? "default" : "ghost"}
          size="icon"
          title={doubleSided ? "Single-sided materials" : "Double-sided materials"}
          disabled={!model}
          onPress={() => toggleDoubleSided()}
        >
          {doubleSided ? <Layers2 className="h-4 w-4" /> : <Layers className="h-4 w-4" />}
        </FeedbackButton>

        <ToolbarDivider />

        <FeedbackButton
          variant="ghost"
          size="icon"
          title="Save viewport screenshot"
          disabled={!model}
          onPress={() => {
            const canvas = getViewportCanvas(viewportRoot.current);
            if (!canvas) return false;
            const name = model?.sourceName?.replace(/\.[^.]+$/, "") ?? "viewport";
            downloadViewportScreenshot(canvas, `${name}-viewport`);
          }}
        >
          <Camera className="h-4 w-4" />
        </FeedbackButton>
        <FeedbackButton
          variant="ghost"
          size="icon"
          title="Fullscreen viewport"
          onPress={() => {
            const el = viewportRoot.current;
            if (!el) return false;
            if (document.fullscreenElement) void document.exitFullscreen();
            else void el.requestFullscreen();
          }}
        >
          <Fullscreen className="h-4 w-4" />
        </FeedbackButton>
      </div>
    </div>
  );
}
