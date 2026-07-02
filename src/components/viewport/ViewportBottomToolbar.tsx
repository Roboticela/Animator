import type { RefObject } from "react";
import {
  Box,
  Camera,
  Clipboard,
  ClipboardPaste,
  Diamond,
  FlipHorizontal2,
  Focus,
  Fullscreen,
  Globe,
  Layers,
  Maximize2,
  ScanLine,
  Shapes,
  Trash2,
} from "lucide-react";
import { FeedbackButton } from "@/components/ui/FeedbackButton";
import { cn } from "@/lib/utils";
import { useModelStore } from "@/store/modelStore";
import { useAnimationStore } from "@/store/animationStore";
import {
  copySelectedBoneTransforms,
  deleteKeyframesAtPlayheadForSelection,
  mirrorSelectedBonesOnX,
  pasteSelectedBoneTransforms,
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
  const hasSelection = selectedBoneNames.length > 0;

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
      <div className="pointer-events-auto flex flex-wrap items-center gap-1 rounded-xl border border-border bg-card/80 p-1 backdrop-blur-sm">
        <FeedbackButton
          variant="ghost"
          size="icon"
          title="Copy transforms (Ctrl+C)"
          disabled={!hasSelection}
          onPress={() => {
            const count = copySelectedBoneTransforms();
            return count > 0;
          }}
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
          title="Mirror on X (M)"
          disabled={!hasSelection}
          onPress={() => {
            mirrorSelectedBonesOnX();
          }}
        >
          <FlipHorizontal2 className="h-4 w-4" />
        </FeedbackButton>
        <FeedbackButton
          variant="ghost"
          size="icon"
          title="Set keyframe (K)"
          disabled={!hasSelection}
          onPress={() => setKeyframesForSelection()}
        >
          <Diamond className="h-4 w-4" />
        </FeedbackButton>
        <FeedbackButton
          variant="ghost"
          size="icon"
          title="Delete keyframe at playhead (Del)"
          disabled={!hasSelection}
          onPress={() => deleteKeyframesAtPlayheadForSelection()}
        >
          <Trash2 className="h-4 w-4" />
        </FeedbackButton>

        <ToolbarDivider />

        <FeedbackButton
          variant="ghost"
          size="icon"
          title="Frame selection (.)"
          disabled={!hasSelection}
          onPress={() => requestFrameSelection()}
        >
          <Focus className="h-4 w-4" />
        </FeedbackButton>
        <FeedbackButton
          variant={isolateSelection ? "default" : "ghost"}
          size="icon"
          title="Isolate selection in skeleton"
          disabled={!hasSelection}
          onPress={() => toggleIsolateSelection()}
        >
          <Layers className="h-4 w-4" />
        </FeedbackButton>
        <FeedbackButton
          variant={gizmoSpace === "world" ? "default" : "ghost"}
          size="icon"
          title={`Gizmo space: ${gizmoSpace} (X)`}
          disabled={!hasSelection}
          onPress={() => toggleGizmoSpace()}
        >
          <Globe className="h-4 w-4" />
        </FeedbackButton>
      </div>

      <div
        className={cn(
          "pointer-events-auto flex flex-wrap items-center justify-end gap-1 rounded-xl border border-border bg-card/80 p-1 backdrop-blur-sm"
        )}
      >
        <FeedbackButton
          variant={showMesh ? "default" : "ghost"}
          size="icon"
          title="Toggle mesh visibility"
          disabled={!model}
          onPress={() => toggleShowMesh()}
        >
          <Shapes className="h-4 w-4" />
        </FeedbackButton>
        <FeedbackButton
          variant={orthographicCamera ? "default" : "ghost"}
          size="icon"
          title="Orthographic camera (O)"
          onPress={() => toggleOrthographicCamera()}
        >
          <Camera className="h-4 w-4" />
        </FeedbackButton>
        <FeedbackButton
          variant={flatShading ? "default" : "ghost"}
          size="icon"
          title="Flat shading"
          disabled={!model}
          onPress={() => toggleFlatShading()}
        >
          <Box className="h-4 w-4" />
        </FeedbackButton>
        <FeedbackButton
          variant={doubleSided ? "default" : "ghost"}
          size="icon"
          title="Double-sided materials"
          disabled={!model}
          onPress={() => toggleDoubleSided()}
        >
          <ScanLine className="h-4 w-4" />
        </FeedbackButton>

        <ToolbarDivider />

        <FeedbackButton
          variant="ghost"
          size="icon"
          title="Screenshot viewport"
          disabled={!model}
          onPress={() => {
            const canvas = getViewportCanvas(viewportRoot.current);
            if (!canvas) return false;
            const name = model?.sourceName?.replace(/\.[^.]+$/, "") ?? "viewport";
            downloadViewportScreenshot(canvas, `${name}-viewport`);
          }}
        >
          <Maximize2 className="h-4 w-4" />
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
