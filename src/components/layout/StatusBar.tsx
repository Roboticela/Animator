import { useModelStore } from "@/store/modelStore";
import { useAnimationStore } from "@/store/animationStore";
import { useViewportFps } from "@/hooks/useViewportFps";

export function StatusBar() {
  const model = useModelStore((s) => s.model);
  const selectedBoneNames = useModelStore((s) => s.selectedBoneNames);
  const showFps = useModelStore((s) => s.showFps);
  const clips = useAnimationStore((s) => s.clips);
  const activeClipId = useAnimationStore((s) => s.activeClipId);
  const isPlaying = useAnimationStore((s) => s.isPlaying);
  const currentTime = useAnimationStore((s) => s.currentTime);
  const duration = useAnimationStore((s) => s.duration);
  const gizmoSpace = useAnimationStore((s) => s.gizmoSpace);
  const fps = useViewportFps(showFps);

  const activeClip = clips.find((c) => c.id === activeClipId);
  const boneCount = model ? model.skeletonGroups.reduce((n, g) => n + g.bones.length, 0) : 0;

  return (
    <div className="flex flex-shrink-0 items-center justify-between gap-3 border-t border-border/60 bg-card/60 px-3 py-1.5 text-[11px] text-foreground-muted backdrop-blur-sm">
      <div className="flex min-w-0 items-center gap-3 truncate">
        <span className="truncate font-medium text-foreground/70">{model?.sourceName ?? "No model"}</span>
        {model && <span>{boneCount} bones</span>}
        {selectedBoneNames.length > 0 && (
          <span className="text-primary">
            {selectedBoneNames.length} selected • gizmo {gizmoSpace}
          </span>
        )}
      </div>
      <div className="flex flex-shrink-0 items-center gap-3 font-mono">
        {showFps && <span className="text-foreground/45">{fps} FPS</span>}
        {activeClip ? (
          <>
            <span className="max-w-[12rem] truncate">{activeClip.name}</span>
            <span>
              {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
            </span>
            <span className={isPlaying ? "text-success" : ""}>{isPlaying ? "Playing" : "Paused"}</span>
          </>
        ) : (
          <span>No active clip</span>
        )}
      </div>
    </div>
  );
}
