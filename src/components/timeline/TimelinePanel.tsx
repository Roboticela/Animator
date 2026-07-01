import { useMemo, useState } from "react";
import { Clapperboard, FilePenLine } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { TransportControls } from "@/components/timeline/TransportControls";
import { TimelineRuler } from "@/components/timeline/TimelineRuler";
import { TimelineTrackRow } from "@/components/timeline/TimelineTrackRow";
import { useAnimationStore } from "@/store/animationStore";
import { useModelStore } from "@/store/modelStore";
import { getAnimatedBoneNames, getBoneKeyframeTimes, moveBoneKeyframe, deleteBoneKeyframe, removeBoneTrack } from "@/lib/clip-builder";
import { duplicateClipAsCustom } from "@/lib/app-actions";

export function TimelinePanel() {
  const clips = useAnimationStore((s) => s.clips);
  const activeClipId = useAnimationStore((s) => s.activeClipId);
  const seek = useAnimationStore((s) => s.seek);
  const currentTime = useAnimationStore((s) => s.currentTime);
  const duration = useAnimationStore((s) => s.duration);
  const updateCustomClipData = useAnimationStore((s) => s.updateCustomClipData);
  const selectBone = useModelStore((s) => s.selectBone);
  const selectedBoneName = useModelStore((s) => s.selectedBoneName);

  const [selectedKeyframe, setSelectedKeyframe] = useState<{ bone: string; time: number } | null>(null);

  const activeClip = clips.find((c) => c.id === activeClipId);
  const isEditable = activeClip?.source === "custom" && Boolean(activeClip.editable);

  const animatedBones = useMemo(
    () => (activeClip?.editable ? getAnimatedBoneNames(activeClip.editable) : []),
    [activeClip]
  );

  if (!activeClip) {
    return (
      <Panel title="Timeline" icon={<Clapperboard className="h-3.5 w-3.5" />} noPadding bodyClassName="flex items-center justify-center">
        <p className="p-4 text-center text-xs text-foreground-muted">
          Pick a clip from the Animation Library (Embedded / Premade / Custom) to play or edit it here.
        </p>
      </Panel>
    );
  }

  const handleSelectKeyframe = (bone: string, time: number) => {
    setSelectedKeyframe({ bone, time });
    selectBone(bone);
    seek(time);
  };

  const handleMoveKeyframe = (bone: string, oldTime: number, newTime: number) => {
    if (!activeClip.editable) return;
    updateCustomClipData(activeClip.id, (data) => moveBoneKeyframe(data, bone, oldTime, newTime));
    setSelectedKeyframe({ bone, time: newTime });
  };

  const handleDeleteKeyframe = (bone: string, time: number) => {
    if (!activeClip.editable) return;
    updateCustomClipData(activeClip.id, (data) => deleteBoneKeyframe(data, bone, time));
    setSelectedKeyframe((prev) => (prev && prev.bone === bone && prev.time === time ? null : prev));
  };

  const handleRemoveTrack = (bone: string) => {
    if (!activeClip.editable) return;
    updateCustomClipData(activeClip.id, (data) => removeBoneTrack(data, bone));
  };

  return (
    <Panel
      title={`Timeline — ${activeClip.name}`}
      icon={<Clapperboard className="h-3.5 w-3.5" />}
      noPadding
      bodyClassName="flex flex-col overflow-hidden"
      actions={
        !isEditable ? (
          <Button variant="outline" size="xs" onClick={() => duplicateClipAsCustom(activeClip)}>
            <FilePenLine className="h-3 w-3" />
            Edit as Custom
          </Button>
        ) : undefined
      }
    >
      <div className="flex flex-shrink-0 items-center gap-3 border-b border-border/60 px-2 py-1.5">
        <TransportControls />
        <TimelineRuler duration={duration || activeClip.duration} currentTime={currentTime} onScrub={seek} />
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-2">
        {!isEditable && (
          <p className="mb-2 rounded-lg border border-border/60 bg-background-subtle p-2 text-xs leading-relaxed text-foreground-muted">
            This is a {activeClip.source} clip and is read-only. Click "Edit as Custom" to copy its keyframes into an
            editable clip.
          </p>
        )}

        {isEditable && animatedBones.length === 0 && (
          <p className="p-2 text-xs leading-relaxed text-foreground-muted">
            No keyframes yet. Select a bone, pose it with the gizmo, then click "Set Keyframe" in the Transform panel
            (right side) to record a pose at the current playhead time.
          </p>
        )}

        <div className="space-y-1">
          {animatedBones.map((bone) => (
            <TimelineTrackRow
              key={bone}
              boneName={bone}
              duration={duration || activeClip.duration}
              times={activeClip.editable ? getBoneKeyframeTimes(activeClip.editable, bone) : []}
              selectedTime={selectedKeyframe?.bone === bone ? selectedKeyframe.time : null}
              isSelectedBone={selectedBoneName === bone}
              onSelectBone={() => selectBone(bone)}
              onSelectKeyframe={(time) => handleSelectKeyframe(bone, time)}
              onMoveKeyframe={(oldTime, newTime) => handleMoveKeyframe(bone, oldTime, newTime)}
              onDeleteKeyframe={(time) => handleDeleteKeyframe(bone, time)}
              onRemoveTrack={() => handleRemoveTrack(bone)}
            />
          ))}
        </div>
      </div>
    </Panel>
  );
}
