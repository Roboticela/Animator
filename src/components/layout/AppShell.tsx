import { useEffect } from "react";
import { Viewport3D } from "@/components/viewport/Viewport3D";
import { BoneTreePanel } from "@/components/panels/BoneTreePanel";
import { SceneInfoPanel } from "@/components/panels/SceneInfoPanel";
import { TransformInspector } from "@/components/panels/TransformInspector";
import { AnimationLibraryPanel } from "@/components/panels/AnimationLibraryPanel";
import { TimelinePanel } from "@/components/timeline/TimelinePanel";
import { useAnimationStore } from "@/store/animationStore";
import { useModelStore } from "@/store/modelStore";
import { resetSelectedBones, setKeyframesForSelection } from "@/lib/app-actions";

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

export function AppShell() {
  const setTransformMode = useAnimationStore((s) => s.setTransformMode);
  const togglePlay = useAnimationStore((s) => s.togglePlay);
  const clearBoneSelection = useModelStore((s) => s.clearBoneSelection);
  const selectAllBones = useModelStore((s) => s.selectAllBones);
  const undo = useAnimationStore((s) => s.undo);
  const redo = useAnimationStore((s) => s.redo);

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
      } else if (e.key === "g" || e.key === "G") {
        useModelStore.getState().toggleGrid();
      } else if (e.key === "l" || e.key === "L") {
        useModelStore.getState().toggleLights();
      } else if (e.key === "h" || e.key === "H") {
        useModelStore.getState().toggleShadows();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setTransformMode, togglePlay, clearBoneSelection, selectAllBones, undo, redo]);

  return (
    <div className="flex h-full flex-col gap-2 overflow-hidden p-2 sm:gap-4 sm:p-4">
      <div className="flex min-h-0 flex-1 gap-2 sm:gap-4">
        <aside className="flex w-64 flex-shrink-0 flex-col gap-2 sm:w-72 sm:gap-4">
          <div className="min-h-0 flex-[1.3]">
            <BoneTreePanel />
          </div>
          <div className="min-h-0 flex-1">
            <SceneInfoPanel />
          </div>
        </aside>

        <main className="min-h-0 min-w-0 flex-1">
          <Viewport3D />
        </main>

        <aside className="flex w-72 flex-shrink-0 flex-col gap-2 sm:w-80 sm:gap-4">
          <div className="min-h-0 flex-[1.4]">
            <AnimationLibraryPanel />
          </div>
          <div className="min-h-0 flex-1">
            <TransformInspector />
          </div>
        </aside>
      </div>

      <div className="h-52 flex-shrink-0 sm:h-56">
        <TimelinePanel />
      </div>
    </div>
  );
}
