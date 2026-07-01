import { useEffect, useState } from "react";
import { KeySquare, MousePointerClick, RefreshCcw } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { NumberInput } from "@/components/ui/NumberInput";
import { Button } from "@/components/ui/Button";
import { useModelStore } from "@/store/modelStore";
import { useAnimationStore } from "@/store/animationStore";
import { captureBoneTransform, upsertKeyframe } from "@/lib/clip-builder";

const RAD2DEG = 180 / Math.PI;
const DEG2RAD = Math.PI / 180;

const AXIS_COLORS = { x: "#f87171", y: "#4ade80", z: "#60a5fa" };

export function TransformInspector() {
  const boneMap = useModelStore((s) => s.boneMap);
  const selectedBoneName = useModelStore((s) => s.selectedBoneName);
  const restPose = useModelStore((s) => s.restPose);

  const activeClip = useAnimationStore((s) => s.clips.find((c) => c.id === s.activeClipId));
  const currentTime = useAnimationStore((s) => s.currentTime);
  const updateCustomClipData = useAnimationStore((s) => s.updateCustomClipData);

  const bone = selectedBoneName ? boneMap.get(selectedBoneName)?.bone : undefined;

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
  }, [bone]);

  if (!selectedBoneName || !bone) {
    return (
      <Panel title="Transform" icon={<MousePointerClick className="h-3.5 w-3.5" />}>
        <p className="p-1 text-xs leading-relaxed text-foreground-muted">
          Select a bone (in the viewport or the Armature tree) to pose it with the gizmo or type exact values here.
        </p>
      </Panel>
    );
  }

  const canKeyframe = activeClip?.source === "custom" && Boolean(activeClip.editable);

  const setKeyframe = () => {
    if (!activeClip?.editable) return;
    const clipId = activeClip.id;
    updateCustomClipData(clipId, (data) => {
      let next = data;
      (["position", "quaternion", "scale"] as const).forEach((prop) => {
        next = upsertKeyframe(next, bone.name, prop, currentTime, captureBoneTransform(bone, prop));
      });
      return next;
    });
  };

  const resetBone = () => {
    const rest = restPose.get(bone.name);
    if (!rest) return;
    bone.position.fromArray(rest.position);
    bone.quaternion.fromArray(rest.quaternion);
    bone.scale.fromArray(rest.scale);
  };

  return (
    <Panel
      title="Transform"
      icon={<MousePointerClick className="h-3.5 w-3.5" />}
      actions={
        <Button variant="ghost" size="icon" title="Reset this bone" onClick={resetBone}>
          <RefreshCcw className="h-3.5 w-3.5" />
        </Button>
      }
    >
      <div className="mb-3 truncate rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">{bone.name}</div>

      <TransformRow
        label="Position"
        values={[bone.position.x, bone.position.y, bone.position.z]}
        step={0.005}
        onChange={(i, v) => bone.position.setComponent(i, v)}
      />
      <TransformRow
        label="Rotation"
        values={[bone.rotation.x * RAD2DEG, bone.rotation.y * RAD2DEG, bone.rotation.z * RAD2DEG]}
        step={1}
        precision={1}
        onChange={(i, v) => {
          const rad = v * DEG2RAD;
          if (i === 0) bone.rotation.x = rad;
          else if (i === 1) bone.rotation.y = rad;
          else bone.rotation.z = rad;
        }}
      />
      <TransformRow
        label="Scale"
        values={[bone.scale.x, bone.scale.y, bone.scale.z]}
        step={0.01}
        onChange={(i, v) => bone.scale.setComponent(i, v)}
      />

      <Button
        variant={canKeyframe ? "default" : "outline"}
        size="sm"
        disabled={!canKeyframe}
        onClick={setKeyframe}
        className="mt-3 w-full"
        title={canKeyframe ? "Add a keyframe for this bone at the playhead" : "Select or create a custom clip to keyframe poses"}
      >
        <KeySquare className="h-3.5 w-3.5" />
        Set Keyframe
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
