import { useCallback, useEffect, useRef, useState } from "react";
import { Viewport3D } from "@/components/viewport/Viewport3D";
import { BoneTreePanel } from "@/components/panels/BoneTreePanel";
import { SceneInfoPanel } from "@/components/panels/SceneInfoPanel";
import { TransformInspector } from "@/components/panels/TransformInspector";
import { AnimationLibraryPanel } from "@/components/panels/AnimationLibraryPanel";
import { TimelinePanel } from "@/components/timeline/TimelinePanel";
import { StatusBar } from "@/components/layout/StatusBar";
import { ResizeHandle } from "@/components/layout/ResizeHandle";
import { useAnimationStore } from "@/store/animationStore";
import { useModelStore } from "@/store/modelStore";
import {
  copySelectedBoneTransforms,
  deleteKeyframesAtPlayheadForSelection,
  mirrorSelectedBonesOnX,
  pasteSelectedBoneTransforms,
  resetSelectedBones,
  setKeyframesForSelection,
} from "@/lib/app-actions";
import {
  clampLayout,
  loadLayoutPreferences,
  LAYOUT_LIMITS,
  saveLayoutPreferences,
  type LayoutPreferences,
} from "@/lib/layout-preferences";

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

export function AppShell() {
  const setTransformMode = useAnimationStore((s) => s.setTransformMode);
  const togglePlay = useAnimationStore((s) => s.togglePlay);
  const stepFrame = useAnimationStore((s) => s.stepFrame);
  const toggleGizmoSpace = useAnimationStore((s) => s.toggleGizmoSpace);
  const clearBoneSelection = useModelStore((s) => s.clearBoneSelection);
  const selectAllBones = useModelStore((s) => s.selectAllBones);
  const undo = useAnimationStore((s) => s.undo);
  const redo = useAnimationStore((s) => s.redo);

  const [layout, setLayout] = useState<LayoutPreferences>(() => loadLayoutPreferences());
  const leftAsideRef = useRef<HTMLElement>(null);
  const rightAsideRef = useRef<HTMLElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);

  const patchLayout = useCallback((patch: Partial<LayoutPreferences>) => {
    setLayout((prev) => clampLayout({ ...prev, ...patch }));
  }, []);

  useEffect(() => {
    saveLayoutPreferences(layout);
  }, [layout]);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;
    const ro = new ResizeObserver(() => {
      const maxTimeline = Math.max(LAYOUT_LIMITS.timelineHeight.min, Math.floor(shell.clientHeight * 0.72));
      setLayout((prev) =>
        prev.timelineHeight > maxTimeline ? clampLayout({ ...prev, timelineHeight: maxTimeline }) : prev
      );
    });
    ro.observe(shell);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;

      const mod = e.ctrlKey || e.metaKey;

      if (mod && e.key.toLowerCase() === "a") {
        e.preventDefault();
        selectAllBones();
        return;
      }

      if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        clearBoneSelection();
        return;
      }

      if (mod && e.key.toLowerCase() === "c") {
        e.preventDefault();
        copySelectedBoneTransforms();
        return;
      }

      if (mod && e.key.toLowerCase() === "v") {
        e.preventDefault();
        pasteSelectedBoneTransforms();
        return;
      }

      if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      if (mod && (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
        return;
      }

      if (e.key === "w" || e.key === "W") setTransformMode("translate");
      else if (e.key === "e" || e.key === "E") setTransformMode("rotate");
      else if (e.key === "r" || e.key === "R") setTransformMode("scale");
      else if (e.key === " ") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "Escape") clearBoneSelection();
      else if (e.key === "k" || e.key === "K") {
        e.preventDefault();
        setKeyframesForSelection();
      } else if (e.key === "Home") {
        e.preventDefault();
        resetSelectedBones();
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        useModelStore.getState().requestFrameCamera();
      } else if (e.key === ".") {
        e.preventDefault();
        useModelStore.getState().requestFrameSelection();
      } else if (e.key === "g" || e.key === "G") {
        useModelStore.getState().toggleGrid();
      } else if (e.key === "l" || e.key === "L") {
        useModelStore.getState().toggleLights();
      } else if (e.key === "h" || e.key === "H") {
        useModelStore.getState().toggleShadows();
      } else if (e.key === "o" || e.key === "O") {
        useModelStore.getState().toggleOrthographicCamera();
      } else if (e.key === "x" || e.key === "X") {
        toggleGizmoSpace();
      } else if (e.key === "m" || e.key === "M") {
        mirrorSelectedBonesOnX();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (mod) return;
        if (useAnimationStore.getState().timelineSelectedKeyframeCount > 0) return;
        e.preventDefault();
        deleteKeyframesAtPlayheadForSelection();
      } else if (mod && e.shiftKey && e.key.toLowerCase() === "i") {
        e.preventDefault();
        useModelStore.getState().invertBoneSelection();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        stepFrame(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        stepFrame(1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setTransformMode, togglePlay, stepFrame, toggleGizmoSpace, clearBoneSelection, selectAllBones, undo, redo]);

  const timelineMaxHeight = () => {
    const shell = shellRef.current;
    if (!shell) return LAYOUT_LIMITS.timelineHeight.max;
    return Math.max(LAYOUT_LIMITS.timelineHeight.min, Math.floor(shell.clientHeight * 0.72));
  };

  return (
    <div ref={shellRef} className="flex h-full min-h-0 flex-col overflow-hidden p-2 sm:p-4">
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside
          ref={leftAsideRef}
          className="flex min-h-0 flex-shrink-0 flex-col overflow-hidden"
          style={{ width: layout.leftWidth }}
        >
          <div className="min-h-0 overflow-hidden" style={{ flex: `${layout.leftSplit} 1 0` }}>
            <BoneTreePanel />
          </div>
          <ResizeHandle
            axis="vertical"
            onDrag={(delta) => {
              const total = leftAsideRef.current?.clientHeight ?? 0;
              if (total <= 0) return;
              const topPx = layout.leftSplit * total + delta;
              patchLayout({ leftSplit: topPx / total });
            }}
          />
          <div className="min-h-0 overflow-hidden" style={{ flex: `${1 - layout.leftSplit} 1 0` }}>
            <SceneInfoPanel />
          </div>
        </aside>

        <ResizeHandle
          axis="horizontal"
          onDrag={(delta) => patchLayout({ leftWidth: layout.leftWidth + delta })}
        />

        <main className="min-h-0 min-w-[240px] flex-1 overflow-hidden">
          <Viewport3D />
        </main>

        <ResizeHandle
          axis="horizontal"
          onDrag={(delta) => patchLayout({ rightWidth: layout.rightWidth + delta })}
        />

        <aside
          ref={rightAsideRef}
          className="flex min-h-0 flex-shrink-0 flex-col overflow-hidden"
          style={{ width: layout.rightWidth }}
        >
          <div className="min-h-0 overflow-hidden" style={{ flex: `${layout.rightSplit} 1 0` }}>
            <AnimationLibraryPanel />
          </div>
          <ResizeHandle
            axis="vertical"
            onDrag={(delta) => {
              const total = rightAsideRef.current?.clientHeight ?? 0;
              if (total <= 0) return;
              const topPx = layout.rightSplit * total + delta;
              patchLayout({ rightSplit: topPx / total });
            }}
          />
          <div className="min-h-0 overflow-hidden" style={{ flex: `${1 - layout.rightSplit} 1 0` }}>
            <TransformInspector />
          </div>
        </aside>
      </div>

      <ResizeHandle
        axis="vertical"
        onDrag={(delta) =>
          patchLayout({
            timelineHeight: Math.min(timelineMaxHeight(), layout.timelineHeight + delta),
          })
        }
      />

      <div
        className="flex min-h-0 flex-shrink-0 flex-col overflow-hidden"
        style={{ height: layout.timelineHeight }}
      >
        <div className="min-h-0 flex-1 overflow-hidden">
          <TimelinePanel />
        </div>
        <StatusBar />
      </div>
    </div>
  );
}
