import { useEffect } from "react";
import { Viewport3D } from "@/components/viewport/Viewport3D";
import { BoneTreePanel } from "@/components/panels/BoneTreePanel";
import { SceneInfoPanel } from "@/components/panels/SceneInfoPanel";
import { TransformInspector } from "@/components/panels/TransformInspector";
import { AnimationLibraryPanel } from "@/components/panels/AnimationLibraryPanel";
import { TimelinePanel } from "@/components/timeline/TimelinePanel";
import { useAnimationStore } from "@/store/animationStore";
import { useModelStore } from "@/store/modelStore";

export function AppShell() {
  const setTransformMode = useAnimationStore((s) => s.setTransformMode);
  const togglePlay = useAnimationStore((s) => s.togglePlay);
  const selectBone = useModelStore((s) => s.selectBone);
  const undo = useAnimationStore((s) => s.undo);
  const redo = useAnimationStore((s) => s.redo);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      if (e.key === "w" || e.key === "W") setTransformMode("translate");
      else if (e.key === "e" || e.key === "E") setTransformMode("rotate");
      else if (e.key === "r" || e.key === "R") setTransformMode("scale");
      else if (e.key === " ") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "Escape") selectBone(null);
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setTransformMode, togglePlay, selectBone, undo, redo]);

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
