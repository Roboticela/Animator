import { TransformControls } from "@react-three/drei";
import { useModelStore } from "@/store/modelStore";
import { useAnimationStore } from "@/store/animationStore";

export function GizmoController() {
  const boneMap = useModelStore((s) => s.boneMap);
  const selectedBoneName = useModelStore((s) => s.selectedBoneName);
  const sceneRadius = useModelStore((s) => s.sceneRadius);
  const mode = useAnimationStore((s) => s.transformMode);

  const bone = selectedBoneName ? boneMap.get(selectedBoneName)?.bone : undefined;
  if (!bone) return null;

  return (
    <TransformControls object={bone} mode={mode} size={Math.min(Math.max(sceneRadius * 0.5, 0.4), 1.2)} space="local" />
  );
}
