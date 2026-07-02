import { useEffect, useState } from "react";
import { Minus, Plus, UnfoldHorizontal } from "lucide-react";
import { FeedbackButton } from "@/components/ui/FeedbackButton";
import { NumberInput } from "@/components/ui/NumberInput";
import { setClipDuration } from "@/lib/clip-builder";
import { zoomTimelineIn, zoomTimelineOut } from "@/lib/timeline-zoom";
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
  const timelineZoom = useAnimationStore((s) => s.timelineZoom);
  const gizmoSpace = useAnimationStore((s) => s.gizmoSpace);
  const setTimelineZoom = useAnimationStore((s) => s.setTimelineZoom);
  const fitTimelineToView = useAnimationStore((s) => s.fitTimelineToView);
  const updateCustomClipData = useAnimationStore((s) => s.updateCustomClipData);
  const fps = useViewportFps(showFps);

  const activeClip = clips.find((c) => c.id === activeClipId);
  const isEditable = activeClip?.source === "custom" && Boolean(activeClip.editable);
  const boneCount = model ? model.skeletonGroups.reduce((n, g) => n + g.bones.length, 0) : 0;

  const [durationDraft, setDurationDraft] = useState(duration);
  useEffect(() => {
    setDurationDraft(duration);
  }, [duration, activeClipId]);

  const commitDuration = (value: number) => {
    if (!activeClipId || !isEditable) return;
    updateCustomClipData(activeClipId, (data) => setClipDuration(data, Math.max(0.5, value)));
  };

  const commitZoom = (value: number) => {
    if (!Number.isFinite(value) || value <= 0) return;
    setTimelineZoom(value);
  };

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
            <span className="max-w-[10rem] truncate text-foreground/60">{activeClip.name}</span>
            <span>
              {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
            </span>

            <div className="flex items-center gap-1.5 border-l border-border/50 pl-3">
              <span className="text-[10px] uppercase tracking-wide text-foreground-muted/80">Zoom</span>
              <div className="flex items-center overflow-hidden rounded-md border border-border bg-background-subtle">
                <FeedbackButton
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-none"
                  title="Zoom out"
                  onPress={() => setTimelineZoom(zoomTimelineOut(timelineZoom))}
                >
                  <Minus className="h-3 w-3" />
                </FeedbackButton>
                <NumberInput
                  label="px"
                  value={timelineZoom}
                  onChange={setTimelineZoom}
                  onCommit={commitZoom}
                  step={8}
                  precision={timelineZoom >= 100 ? 0 : 1}
                  className="h-6 w-[4.75rem] rounded-none border-0 border-x border-border text-[11px]"
                />
                <FeedbackButton
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-none"
                  title="Zoom in"
                  onPress={() => setTimelineZoom(zoomTimelineIn(timelineZoom))}
                >
                  <Plus className="h-3 w-3" />
                </FeedbackButton>
              </div>
              <FeedbackButton
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                title="Fit clip to timeline width"
                onPress={() => fitTimelineToView()}
              >
                <UnfoldHorizontal className="h-3.5 w-3.5" />
              </FeedbackButton>
            </div>

            {isEditable && (
              <div className="flex items-center gap-1.5 border-l border-border/50 pl-3">
                <span className="text-[10px] uppercase tracking-wide text-foreground-muted/80">Duration</span>
                <div className="flex items-center overflow-hidden rounded-md border border-border bg-background-subtle">
                  <FeedbackButton
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-none"
                    title="Shorten clip by 0.1s"
                    onPress={() => commitDuration(Math.max(0.5, durationDraft - 0.1))}
                  >
                    <Minus className="h-3 w-3" />
                  </FeedbackButton>
                  <NumberInput
                    label="s"
                    value={durationDraft}
                    onChange={setDurationDraft}
                    onCommit={commitDuration}
                    step={0.1}
                    precision={1}
                    className="h-6 w-[4rem] rounded-none border-0 border-x border-border text-[11px]"
                  />
                  <FeedbackButton
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-none"
                    title="Lengthen clip by 0.1s"
                    onPress={() => commitDuration(durationDraft + 0.1)}
                  >
                    <Plus className="h-3 w-3" />
                  </FeedbackButton>
                </div>
              </div>
            )}

            <span className={isPlaying ? "text-success" : ""}>{isPlaying ? "Playing" : "Paused"}</span>
          </>
        ) : (
          <span>No active clip</span>
        )}
      </div>
    </div>
  );
}
