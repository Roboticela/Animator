import { useEffect, useMemo, useState } from "react";
import type { Bone } from "three";
import { Diamond, Move3d, RotateCcw } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { NumberInput } from "@/components/ui/NumberInput";
import { Button } from "@/components/ui/Button";
import { useModelStore, getPrimaryBoneName } from "@/store/modelStore";
import { useAnimationStore } from "@/store/animationStore";
import { resetSelectedBones, setKeyframesForSelection } from "@/lib/app-actions";
import { updateBoneHierarchy } from "@/lib/bone-transform";

const RAD2DEG = 180 / Math.PI;
const DEG2RAD = Math.PI / 180;

const AXIS_COLORS = { x: "#f87171", y: "#4ade80", z: "#60a5fa" };

export function TransformInspector() {
  const boneMap = useModelStore((s) => s.boneMap);
  const selectedBoneNames = useModelStore((s) => s.selectedBoneNames);

  const activeClip = useAnimationStore((s) => s.clips.find((c) => c.id === s.activeClipId));

  const primaryName = getPrimaryBoneName(selectedBoneNames);
  const bone = primaryName ? boneMap.get(primaryName)?.bone : undefined;
  const multiSelect = selectedBoneNames.length > 1;

  const selectedBones = useMemo(
    () =>
      selectedBoneNames
        .map((name) => boneMap.get(name)?.bone)
        .filter((b): b is Bone => Boolean(b)),
    [selectedBoneNames, boneMap]
  );

  const [, setTick] = useState(0);
  useEffect(() => {
    if (!bone) return;
    let raf = 0;
    let last = 0;
    const loop = (t: number) => {
      if (t - last > 66) {
        last = t;
        setTick((n) => n + 1);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [bone, selectedBoneNames]);

  if (!primaryName || !bone) {
    return (
      <Panel title="Transform" icon={<Move3d className="h-3.5 w-3.5" />}>
        <p className="p-1 text-xs leading-relaxed text-foreground-muted">
          Select bones in the tree or viewport. Ctrl+click to add/remove, Shift+click for a range, Ctrl+A for all.
          Gizmo, numeric edits, and keyframes (K) apply to every selected bone.
        </p>
      </Panel>
    );
  }

  const canKeyframe = activeClip?.source === "custom" && Boolean(activeClip.editable);

  const applyToAll = (fn: (b: Bone) => void) => {
    for (const b of selectedBones) fn(b);
    updateBoneHierarchy(selectedBones);
  };

  return (
    <Panel
      title="Transform"
      icon={<Move3d className="h-3.5 w-3.5" />}
      actions={
        <Button
          variant="ghost"
          size="icon"
          title={multiSelect ? "Reset selected bones (Home)" : "Reset this bone (Home)"}
          onClick={resetSelectedBones}
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      }
    >
      {multiSelect ? (
        <div className="mb-3 space-y-1 rounded-md bg-primary/10 px-2 py-1.5">
          <div className="text-xs font-semibold text-primary">{selectedBoneNames.length} bones selected</div>
          <div className="custom-scrollbar max-h-16 overflow-y-auto text-[10px] leading-relaxed text-foreground/55">
            {selectedBoneNames.join(", ")}
          </div>
          <div className="text-[10px] text-foreground/45">Gizmo on {primaryName} — delta applies to all</div>
        </div>
      ) : (
        <div className="mb-3 truncate rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">{bone.name}</div>
      )}

      <TransformRow
        label="Position"
        values={[bone.position.x, bone.position.y, bone.position.z]}
        step={0.005}
        onChange={(i, v) => applyToAll((b) => b.position.setComponent(i, v))}
      />
      <TransformRow
        label="Rotation"
        values={[bone.rotation.x * RAD2DEG, bone.rotation.y * RAD2DEG, bone.rotation.z * RAD2DEG]}
        step={1}
        precision={1}
        onChange={(i, v) => {
          const rad = v * DEG2RAD;
          applyToAll((b) => {
            if (i === 0) b.rotation.x = rad;
            else if (i === 1) b.rotation.y = rad;
            else b.rotation.z = rad;
          });
        }}
      />
      <TransformRow
        label="Scale"
        values={[bone.scale.x, bone.scale.y, bone.scale.z]}
        step={0.01}
        onChange={(i, v) => applyToAll((b) => b.scale.setComponent(i, v))}
      />

      <Button
        variant={canKeyframe ? "default" : "outline"}
        size="sm"
        disabled={!canKeyframe}
        onClick={() => setKeyframesForSelection()}
        className="mt-3 w-full"
        title={
          canKeyframe
            ? multiSelect
              ? "Add keyframes for all selected bones (K)"
              : "Add a keyframe for this bone (K)"
            : "Select or create a custom clip to keyframe poses"
        }
      >
        <Diamond className="h-3.5 w-3.5" />
        {multiSelect ? `Set Keyframes (${selectedBoneNames.length})` : "Set Keyframe"}
      </Button>
    </Panel>
  );
}

function TransformRow({
  label,
  values,
  step,
  precision = 3,
  onChange,
}: {
  label: string;
  values: [number, number, number];
  step: number;
  precision?: number;
  onChange: (index: number, value: number) => void;
}) {
  return (
    <div className="mb-2">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-foreground-muted">{label}</div>
      <div className="grid grid-cols-3 gap-1.5">
        {(["x", "y", "z"] as const).map((axis, i) => (
          <NumberInput
            key={axis}
            label={axis.toUpperCase()}
            accent={AXIS_COLORS[axis]}
            value={values[i]}
            step={step}
            precision={precision}
            onChange={(v) => onChange(i, v)}
          />
        ))}
      </div>
    </div>
  );
}
